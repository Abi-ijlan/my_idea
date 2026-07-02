import { supabase } from '../../api/_shared';

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
  if (req.method === 'GET') {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase is not configured.' });
    }

    const targetUserId = typeof req.query.userId === 'string' ? req.query.userId : 'local-user';
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase ideas fetch error:', error);
      return res.status(500).json({ error: 'Failed to load ideas' });
    }

    return res.status(200).json((data || []).map(mapIdea));
  }

  if (req.method === 'POST') {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase is not configured.' });
    }

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

    const { data, error } = await supabase.from('ideas').insert(payload).select('*').single();
    if (error) {
      console.error('Supabase ideas insert error:', error);
      return res.status(500).json({ error: 'Failed to create idea' });
    }

    return res.status(200).json(mapIdea(data));
  }

  if (req.method === 'DELETE') {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase is not configured.' });
    }

    const targetUserId = typeof req.query.userId === 'string' ? req.query.userId : 'local-user';
    const { error } = await supabase.from('ideas').delete().eq('user_id', targetUserId);

    if (error) {
      console.error('Supabase ideas clear error:', error);
      return res.status(500).json({ error: 'Failed to clear ideas' });
    }

    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
