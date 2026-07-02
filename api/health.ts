import { supabase } from './_shared';

export default function handler(_req: any, res: any) {
  res.status(200).json({
    ok: true,
    supabaseConfigured: Boolean(supabase),
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL?.trim()),
    hasSupabaseAnonKey: Boolean(process.env.SUPABASE_ANON_KEY?.trim()),
  });
}
