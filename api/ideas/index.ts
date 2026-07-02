import { randomUUID } from 'crypto';
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

const getQueryValue = (req: any, key: string) => {
  if (req.query && typeof req.query[key] === 'string') {
    return req.query[key];
  }

  const requestUrl = new URL(req.url || '/', 'https://idea-vault.local');
  return requestUrl.searchParams.get(key) || undefined;
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const targetUserId = getQueryValue(req, 'userId') || 'local-user';
      const path = `ideas?select=*&user_id=eq.${encodeURIComponent(targetUserId)}&order=created_at.desc`;
      const data = await supabaseRequest<any[]>(path);

      return res.status(200).json((data || []).map(mapIdea));
    }

    if (req.method === 'POST') {
      const idea = await readJsonBody(req);
      if (!idea?.title || !idea?.description) {
        return res.status(400).json({ error: 'Title and description are required.' });
      }

      const payload = {
        id: idea.id || randomUUID(),
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
      const targetUserId = getQueryValue(req, 'userId') || 'local-user';
      const path = `ideas?user_id=eq.${encodeURIComponent(targetUserId)}`;

      await supabaseRequest<void>(path, {
        method: 'DELETE',
        prefer: 'return=minimal',
      });

      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    const message = error.message || 'Ideas API request failed.';
    const status = message === 'Supabase is not configured.' ? 503 : 500;
    console.error('Ideas API error:', error);
    return res.status(status).json({ error: message });
  }
}
