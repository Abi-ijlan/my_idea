/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Express server is deprecated for Vercel deployment.
// API routes are now served from the /api directory.

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

let supabase: any = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully.');
  } catch (error) {
    console.warn('Supabase client initialization failed; cloud persistence is unavailable.', error);
  }
} else {
  console.warn('Supabase environment values are missing; cloud persistence is unavailable.');
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, supabaseConfigured: Boolean(supabase) });
});

app.get('/api/ideas', async (req, res) => {
  const { userId } = req.query;
  const targetUserId = typeof userId === 'string' ? userId : 'local-user';

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured.' });
  }

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase ideas fetch error:', error);
    return res.status(500).json({ error: 'Failed to load ideas' });
  }

  const ideas = (data || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    color: item.color,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    isPinned: item.is_pinned,
    userId: item.user_id,
  }));

  return res.json(ideas);
});

app.post('/api/ideas', async (req, res) => {
  const idea = req.body;
  if (!idea?.title || !idea?.description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured.' });
  }

  const payload = {
    id: idea.id || crypto.randomUUID(),
    title: idea.title,
    description: idea.description,
    category: idea.category,
    color: idea.color || 'cyan',
    created_at: idea.createdAt || Date.now(),
    updated_at: idea.updatedAt || Date.now(),
    is_pinned: Boolean(idea.isPinned),
    user_id: idea.userId || 'local-user',
  };

  const { data, error } = await supabase.from('ideas').insert(payload).select('*').single();

  if (error || !data) {
    console.error('Supabase ideas insert error:', error);
    return res.status(500).json({ error: 'Failed to create idea' });
  }

  return res.json({
    id: data.id,
    title: data.title,
    description: data.description,
    category: data.category,
    color: data.color,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    isPinned: data.is_pinned,
    userId: data.user_id,
  });
});

app.put('/api/ideas/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured.' });
  }

  const payload: Record<string, any> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.isPinned !== undefined) payload.is_pinned = Boolean(updates.isPinned);
  if (updates.updatedAt !== undefined) payload.updated_at = updates.updatedAt;
  if (updates.userId !== undefined) payload.user_id = updates.userId;

  const { data, error } = await supabase.from('ideas').update(payload).eq('id', id).select('*').single();

  if (error || !data) {
    console.error('Supabase ideas update error:', error);
    return res.status(500).json({ error: 'Failed to update idea' });
  }

  return res.json({
    id: data.id,
    title: data.title,
    description: data.description,
    category: data.category,
    color: data.color,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    isPinned: data.is_pinned,
    userId: data.user_id,
  });
});

app.delete('/api/ideas/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured.' });
  }

  const { error } = await supabase.from('ideas').delete().eq('id', id).eq('user_id', userId || 'local-user');

  if (error) {
    console.error('Supabase ideas delete error:', error);
    return res.status(500).json({ error: 'Failed to delete idea' });
  }

  return res.json({ success: true });
});

app.delete('/api/ideas', async (req, res) => {
  const { userId } = req.query;
  const targetUserId = typeof userId === 'string' ? userId : 'local-user';

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured.' });
  }

  const { error } = await supabase.from('ideas').delete().eq('user_id', targetUserId);

  if (error) {
    console.error('Supabase ideas clear error:', error);
    return res.status(500).json({ error: 'Failed to clear ideas' });
  }

  return res.json({ success: true });
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
