import { supabase } from './_shared';

export default function handler(_req: any, res: any) {
  res.status(200).json({ ok: true, supabaseConfigured: Boolean(supabase) });
}
