import * as https from 'https';

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

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return {
    restUrl: `${url.replace(/\/$/, '')}/rest/v1`,
    anonKey,
  };
};

const readJsonBody = (req: any) =>
  new Promise<any>((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      resolve(req.body);
      return;
    }

    let raw = '';
    req.on('data', (chunk: Buffer) => {
      raw += chunk.toString('utf8');
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const supabaseRequest = <T>(path: string, options: { method?: string; body?: unknown; prefer?: string } = {}) =>
  new Promise<T>((resolve, reject) => {
    const config = getSupabaseConfig();
    if (!config) {
      reject(new Error('Supabase is not configured.'));
      return;
    }

    const url = new URL(`${config.restUrl}/${path}`);
    const body = options.body === undefined ? undefined : JSON.stringify(options.body);

    const request = https.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
          ...(options.prefer ? { Prefer: options.prefer } : {}),
          ...(body ? { 'Content-Length': Buffer.byteLength(body).toString() } : {}),
        },
      },
      (response) => {
        let raw = '';
        response.on('data', (chunk) => {
          raw += chunk.toString('utf8');
        });
        response.on('end', () => {
          const status = response.statusCode || 500;
          if (status < 200 || status >= 300) {
            try {
              const parsed = JSON.parse(raw);
              reject(new Error(parsed.message || parsed.error || `Supabase request failed with status ${status}.`));
            } catch {
              reject(new Error(raw || `Supabase request failed with status ${status}.`));
            }
            return;
          }

          if (!raw.trim()) {
            resolve(undefined as T);
            return;
          }

          try {
            resolve(JSON.parse(raw));
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on('error', reject);
    if (body) {
      request.write(body);
    }
    request.end();
  });

const getId = (req: any) => {
  if (typeof req.query?.id === 'string') {
    return req.query.id;
  }

  const pathname = new URL(req.url || '/', 'https://idea-vault.local').pathname;
  return pathname.split('/').filter(Boolean).pop();
};

export default async function handler(req: any, res: any) {
  try {
    const id = getId(req);
    if (!id) {
      return res.status(400).json({ error: 'Idea id is required.' });
    }

    if (req.method === 'PUT') {
      const updates = await readJsonBody(req);
      const payload: Record<string, any> = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.isPinned !== undefined) payload.is_pinned = Boolean(updates.isPinned);
      if (updates.updatedAt !== undefined) payload.updated_at = updates.updatedAt;
      if (updates.userId !== undefined) payload.user_id = updates.userId;

      const path = `ideas?id=eq.${encodeURIComponent(id)}`;
      const data = await supabaseRequest<any[]>(path, {
        method: 'PATCH',
        body: payload,
        prefer: 'return=representation',
      });

      if (!data[0]) {
        return res.status(404).json({ error: 'Idea not found.' });
      }

      return res.status(200).json(mapIdea(data[0]));
    }

    if (req.method === 'DELETE') {
      const { userId } = await readJsonBody(req);
      const path = `ideas?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId || 'local-user')}`;

      await supabaseRequest<void>(path, {
        method: 'DELETE',
        prefer: 'return=minimal',
      });

      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    const message = error.message || 'Idea detail API request failed.';
    const status = message === 'Supabase is not configured.' ? 503 : 500;
    console.error('Idea detail API error:', error);
    return res.status(status).json({ error: message });
  }
}
