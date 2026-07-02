export default function handler(_req: any, res: any) {
  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL?.trim());
  const hasSupabaseAnonKey = Boolean(process.env.SUPABASE_ANON_KEY?.trim());

  res.status(200).json({
    ok: true,
    supabaseConfigured: hasSupabaseUrl && hasSupabaseAnonKey,
    hasSupabaseUrl,
    hasSupabaseAnonKey,
  });
}
