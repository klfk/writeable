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

Fill `.env` with Supabase values and `AI_GATEWAY_API_KEY` before using AI feedback features.

## Checks

```bash
npm run lint
npm run build
```
