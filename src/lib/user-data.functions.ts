import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const profileSchema = z.object({
  first_name: z.string().trim().max(80).nullable().optional(),
  last_name: z.string().trim().max(80).nullable().optional(),
  native_language: z.string().trim().max(80).nullable().optional(),
  learner_type: z.string().trim().max(80).nullable().optional(),
  learning_reason: z.string().trim().max(500).nullable().optional(),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, native_language, learner_type, learning_reason, display_name, avatar_url",
      )
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const upsertProgressSchema = z.object({
  task_id: z.string().min(1).max(200),
  content: z.string().max(200000),
  status: z.enum(["in_progress", "checked", "done"]).default("in_progress"),
  last_score: z.number().nullable().optional(),
});

export const upsertProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertProgressSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_progress").upsert(
      {
        user_id: context.userId,
        task_id: data.task_id,
        content: data.content,
        status: data.status,
        last_score: data.last_score ?? null,
      },
      { onConflict: "user_id,task_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_progress")
      .select("task_id, content, status, last_score, updated_at")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Progress + profile rows cascade via FK ON DELETE CASCADE against auth.users.
    // If a project ever loses those, delete them explicitly first.
    await supabaseAdmin.from("user_progress").delete().eq("user_id", context.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", context.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
