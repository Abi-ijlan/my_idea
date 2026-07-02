import { supabaseRequest } from '../_supabaseRest';

const mapIdea = (item: any) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  category: item.category,
  color: item.color,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  isPinned: item.is_pinned,
  userId: item.user_id,
});

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const targetUserId = typeof req.query.userId === 'string' ? req.query.userId : 'local-user';
      const query = `?select=*&user_id=eq.${encodeURIComponent(targetUserId)}&order=created_at.desc`;
      const data = await supabaseRequest<any[]>('ideas', { query });

      return res.status(200).json((data || []).map(mapIdea));
    }

    if (req.method === 'POST') {
      const idea = req.body;
      if (!idea?.title || !idea?.description) {
        return res.status(400).json({ error: 'Title and description are required.' });
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

      const data = await supabaseRequest<any[]>('ideas', {
        method: 'POST',
        body: payload,
        prefer: 'return=representation',
      });

      return res.status(200).json(mapIdea(data[0]));
    }

    if (req.method === 'DELETE') {
      const targetUserId = typeof req.query.userId === 'string' ? req.query.userId : 'local-user';
      const query = `?user_id=eq.${encodeURIComponent(targetUserId)}`;

      await supabaseRequest<void>('ideas', {
        method: 'DELETE',
        query,
        prefer: 'return=minimal',
      });

      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    const message = error.message || 'Supabase request failed.';
    const status = message === 'Supabase is not configured.' ? 503 : 500;
    console.error('Ideas API error:', error);
    return res.status(status).json({ error: message });
  }
}
