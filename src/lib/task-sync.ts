import { supabase } from "@/integrations/supabase/client";
import { upsertProgress, listMyProgress } from "@/lib/user-data.functions";

const SAVE_PREFIX = "task_save_";
const saveKey = (taskId: string) => `${SAVE_PREFIX}${taskId}`;

type LocalSave = {
  savedAt?: string;
  relevanceScore?: number | null;
  checkDone?: boolean;
  [k: string]: unknown;
};

function readLocal(taskId: string): LocalSave | null {
  try {
    const raw = localStorage.getItem(saveKey(taskId));
    return raw ? (JSON.parse(raw) as LocalSave) : null;
  } catch {
    return null;
  }
}

function listLocalTaskIds(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(SAVE_PREFIX)) ids.push(k.slice(SAVE_PREFIX.length));
    }
  } catch {
    // ignore
  }
  return ids;
}

function statusFor(save: LocalSave): "in_progress" | "checked" {
  return save.checkDone ? "checked" : "in_progress";
}

/**
 * Push a single local task save to the cloud. No-op if signed out.
 * Fire-and-forget; failures are swallowed so writing UX is never blocked.
 */
export async function pushTaskSave(taskId: string): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    const local = readLocal(taskId);
    if (!local) return;
    await upsertProgress({
      data: {
        task_id: taskId,
        content: JSON.stringify(local),
        status: statusFor(local),
        last_score: typeof local.relevanceScore === "number" ? local.relevanceScore : null,
      },
    });
  } catch {
    // ignore
  }
}

/**
 * Called from AuthProvider on SIGNED_IN. Uploads any local drafts the
 * cloud doesn't have yet, then pulls cloud drafts the local device
 * doesn't have. Newest wins on conflict.
 */
export async function syncOnSignIn(): Promise<void> {
  try {
    const cloud = await listMyProgress();
    const cloudByTask = new Map<string, (typeof cloud)[number]>();
    for (const row of cloud) cloudByTask.set(row.task_id, row);

    const localIds = listLocalTaskIds();

    // Upload local rows newer than cloud (or missing from cloud).
    for (const taskId of localIds) {
      const local = readLocal(taskId);
      if (!local) continue;
      const remote = cloudByTask.get(taskId);
      const localTime = local.savedAt ? new Date(local.savedAt).getTime() : 0;
      const remoteTime = remote?.updated_at ? new Date(remote.updated_at).getTime() : 0;
      if (!remote || localTime > remoteTime) {
        try {
          await upsertProgress({
            data: {
              task_id: taskId,
              content: JSON.stringify(local),
              status: statusFor(local),
              last_score: typeof local.relevanceScore === "number" ? local.relevanceScore : null,
            },
          });
        } catch {
          // ignore
        }
      }
    }

    // Pull cloud rows newer than local (or missing locally).
    for (const row of cloud) {
      const local = readLocal(row.task_id);
      const localTime = local?.savedAt ? new Date(local.savedAt).getTime() : 0;
      const remoteTime = row.updated_at ? new Date(row.updated_at).getTime() : 0;
      if (!local || remoteTime > localTime) {
        try {
          // content is a JSON string of the LocalSave blob.
          const parsed = JSON.parse(row.content);
          localStorage.setItem(saveKey(row.task_id), JSON.stringify(parsed));
        } catch {
          // ignore malformed rows
        }
      }
    }

    // Nudge listeners (workbook page listens to `storage` events for cross-tab
    // updates; dispatch one synthetically so the current tab refreshes too).
    try {
      window.dispatchEvent(new StorageEvent("storage", { key: SAVE_PREFIX }));
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
}
