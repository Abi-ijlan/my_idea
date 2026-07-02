import { supabase } from '../_shared';

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
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured.' });
  }

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

    const { data, error } = await supabase.from('ideas').update(payload).eq('id', id).select('*').single();
    if (error) {
      console.error('Supabase ideas update error:', error);
      return res.status(500).json({ error: 'Failed to update idea' });
    }

    return res.status(200).json(mapIdea(data));
  }

  if (req.method === 'DELETE') {
    const { userId } = req.body;
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id)
      .eq('user_id', userId || 'local-user');

    if (error) {
      console.error('Supabase ideas delete error:', error);
      return res.status(500).json({ error: 'Failed to delete idea' });
    }

    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
