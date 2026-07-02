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
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Idea id is required.' });
    }

    if (req.method === 'PUT') {
      const updates = req.body;
      const payload: Record<string, any> = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.isPinned !== undefined) payload.is_pinned = Boolean(updates.isPinned);
      if (updates.updatedAt !== undefined) payload.updated_at = updates.updatedAt;
      if (updates.userId !== undefined) payload.user_id = updates.userId;

      const data = await supabaseRequest<any[]>('ideas', {
        method: 'PATCH',
        query: `?id=eq.${encodeURIComponent(id)}`,
        body: payload,
        prefer: 'return=representation',
      });

      if (!data[0]) {
        return res.status(404).json({ error: 'Idea not found.' });
      }

      return res.status(200).json(mapIdea(data[0]));
    }

    if (req.method === 'DELETE') {
      const { userId } = req.body || {};
      const query = `?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId || 'local-user')}`;

      await supabaseRequest<void>('ideas', {
        method: 'DELETE',
        query,
        prefer: 'return=minimal',
      });

      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    const message = error.message || 'Supabase request failed.';
    const status = message === 'Supabase is not configured.' ? 503 : 500;
    console.error('Idea detail API error:', error);
    return res.status(status).json({ error: message });
  }
}
