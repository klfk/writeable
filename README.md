# Writeable

Writeable is a task-based language learning app for writing practice. Learners choose prompts by level, write a response, and get focused feedback on relevance, CEFR level, grammar, style, and vocabulary.

Built for the ETH university AI competition.

## Features

- Workbooks for beginner, intermediate, advanced, business, and exam-style writing tasks
- Inline issue highlighting after checks
- Correction cards with explanations, rule links, and optional suggestion reveal
- Rewrite challenge and before/after comparison plugins
- AI feedback panel with strengths, priorities, and a next step
- Progress, timer, saved drafts, and account sync
- German and French UI translations

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Fill `.env` with Supabase values and `OPENAI_API_KEY` before using AI feedback features.

## Backend automation

MCP connectors are configured in `.mcp.json` for:

- Supabase, scoped to project `iiskizsngljnosnehbeu`
- Vercel

Supabase migrations live in `supabase/migrations/` and are applied by the GitHub Actions workflow in `.github/workflows/supabase-migrations.yml`.

Configure these in GitHub before running it:

- Repository variable: `SUPABASE_PROJECT_ID`
- Repository secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`

The app is hosted on Vercel as project `writeable`.

Production deployment:

- `https://writeable-phi.vercel.app`
- Intended custom domain: `writeable.ivanm.xyz`

DNS still needs to point `writeable.ivanm.xyz` to Vercel:

```txt
A writeable 76.76.21.21
```

The app runtime also needs these environment variables in Vercel:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for server-side account deletion only
- `OPENAI_API_KEY` for AI checks/translations/feedback
- `OPENAI_MODEL` optionally overrides the default model (`gpt-4o-mini`)

## Checks

```bash
npm run lint
npm run build
```
