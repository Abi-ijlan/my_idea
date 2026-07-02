# Idea Vault

Idea Vault is a cloud-based idea manager for capturing, organizing, and refining product, startup, design, and technical ideas. It uses a React/Vite frontend, Supabase for required cloud persistence, and Gemini for optional AI-assisted idea refinement.

## Features

- Create, edit, pin, delete, and clear ideas
- Categorize ideas as Startup, Creative, Tech, Concept, Design, or Other
- Search ideas by title or description
- Filter by category and sort by newest, oldest, or alphabetical order
- Seed sample ideas for quick testing
- Store ideas in Supabase with no browser local storage fallback
- Use Gemini-powered actions on each idea:
  - Refine the title and description
  - Generate next steps
  - Suggest a technical stack

## Tech Stack

- React 19
- Vite 6
- TypeScript
- Tailwind CSS 4
- Motion for UI animation
- Lucide React for icons
- Supabase for database persistence
- Google Gemini API for AI features
- Vercel API routes for production backend functions

## Project Structure

```text
idea_vault/
  api/
    _shared.ts              Shared Supabase and Gemini clients
    health.ts               API health check
    gemini/enhance.ts       Gemini idea refinement endpoint
    ideas/index.ts          List, create, and clear ideas
    ideas/[id].ts           Update and delete one idea
  src/
    components/
      IdeaCard.tsx          Idea display, editing, pinning, deleting, AI actions
      IdeaForm.tsx          New idea form
    lib/
      ideasApi.ts           Cloud-only client API wrapper
    App.tsx                 Main app state and layout
    index.css               Tailwind theme and custom utilities
    main.tsx                React entry point
    types.ts                Idea and category types
  server.ts                 Local Express/Vite development server for API testing
  vercel.json               Vercel deployment config
```

## Cloud-Only Persistence

Supabase is required. The app does not save ideas to `localStorage`.

If Supabase is missing or unavailable, the UI shows a cloud storage error and write operations fail instead of silently saving in the browser. This keeps Chrome, Edge, deployed builds, and other clients pointed at the same cloud source of truth.

## Environment Variables

Create `.env.local` in the project root. Do not commit this file.

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

Required:

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anon public key

Optional:

- `GEMINI_API_KEY`: Required only for AI refinement, next steps, and tech stack actions

## Supabase Setup

1. Create a Supabase project.
2. Open Project Settings > API.
3. Copy the Project URL into `SUPABASE_URL`.
4. Copy the anon public key into `SUPABASE_ANON_KEY`.
5. Open SQL Editor and create the `ideas` table:

```sql
create table if not exists ideas (
  id text primary key,
  title text not null,
  description text not null,
  category text,
  color text,
  created_at bigint,
  updated_at bigint,
  is_pinned boolean default false,
  user_id text not null
);
```

For this current single-user app, rows are written with:

```text
user_id = local-user
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the full local app with API support:

```bash
npx tsx server.ts
```

Open:

```text
http://localhost:3000
```

Check backend health:

```text
http://localhost:3000/api/health
```

Expected response:

```json
{
  "ok": true,
  "supabaseConfigured": true
}
```

Note: `npm run dev` starts the Vite frontend only. Use `npx tsx server.ts` when you want local `/api/*` routes to work exactly like the app expects.

## Available Scripts

```bash
npm run dev
```

Starts the Vite frontend dev server.

```bash
npm run build
```

Builds the production frontend into `dist`.

```bash
npm run preview
```

Previews the production build.

```bash
npm run lint
```

Runs TypeScript checks with `tsc --noEmit`.

## Deployment

The project is configured for Vercel.

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Add environment variables in Vercel Project Settings:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`, if AI features are needed
4. Use:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Deploy.

The Vercel config builds the Vite frontend as static assets and deploys the TypeScript API routes under `/api`.

## API Overview

### `GET /api/health`

Returns whether the backend is running and Supabase is configured.

### `GET /api/ideas?userId=local-user`

Loads ideas for the current user id.

### `POST /api/ideas`

Creates an idea in Supabase.

### `PUT /api/ideas/:id`

Updates an existing idea.

### `DELETE /api/ideas/:id`

Deletes one idea.

### `DELETE /api/ideas?userId=local-user`

Deletes all ideas for the current user id.

### `POST /api/gemini/enhance`

Runs one Gemini action:

- `enhance`
- `next-steps`
- `tech-stack`

## Troubleshooting

### Ideas are not appearing in Supabase

- Confirm the app is using the same Supabase project you are viewing in the dashboard.
- Check the `public.ideas` table.
- Clear filters in Supabase's table editor.
- Look for rows where `user_id` is `local-user`.
- Call `/api/health` and confirm `supabaseConfigured` is `true`.

### The app says cloud storage is unavailable

- Check that `.env.local` contains `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- Restart the local server after editing environment variables.
- Confirm the `ideas` table exists.
- Confirm the anon key belongs to the same project as the URL.

### AI actions fail

- Add `GEMINI_API_KEY` to `.env.local` or the deployed environment.
- Restart the local server after changing `.env.local`.
- Cloud storage can still work without Gemini.

### `/api/*` routes fail locally

- Make sure you started the app with:

```bash
npx tsx server.ts
```

The plain Vite dev server does not run the local Express API server.

## Security Notes

- `.env.local` is ignored by git and should remain private.
- The Supabase anon key is safe to use in server-side API routes, but database rules should still be configured according to your production security requirements.
- The current app uses a fixed `local-user` id and does not include authentication.
- For multi-user production use, add authentication and enforce row-level security policies in Supabase.

## Current Limitations

- No login or user accounts
- All app users share the `local-user` record scope unless changed
- No offline storage
- AI features require a configured Gemini API key
- Supabase table setup is manual
