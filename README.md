# Idea Vault

A lightweight cloud-based idea manager backed by Supabase persistence.

## Run locally

Prerequisites: Node.js

1. Install dependencies:
   `npm install`
2. Create a local environment file from [.env.local](.env.local) and add your values:
   - `GEMINI_API_KEY` for AI features
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` for cloud storage
3. Start the app:
   `npm run dev -- --host 0.0.0.0`
4. Open http://localhost:3000

## Supabase setup

1. Create a Supabase project.
2. Open Project Settings → API.
3. Copy the Project URL and anon public key.
4. Add them to [.env.local](.env.local):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

5. Create an `ideas` table with this SQL:

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

Supabase is required. Ideas are stored in the cloud and no browser local storage fallback is used.
