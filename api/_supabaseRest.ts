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

export const isSupabaseConfigured = () => Boolean(getSupabaseConfig());

type SupabaseRequestOptions = {
  method?: string;
  query?: string;
  body?: unknown;
  prefer?: string;
};

export async function supabaseRequest<T>(
  table: string,
  { method = 'GET', query = '', body, prefer }: SupabaseRequestOptions = {},
): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase is not configured.');
  }

  const response = await fetch(`${config.restUrl}/${table}${query}`, {
    method,
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Supabase request failed (${response.status} ${response.statusText || 'Error'}).`;
    try {
      const data = await response.json();
      if (typeof data?.message === 'string') {
        message = data.message;
      } else if (typeof data?.error === 'string') {
        message = data.error;
      }
    } catch {
      const text = await response.text();
      if (text.trim()) {
        message = text.trim();
      }
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
