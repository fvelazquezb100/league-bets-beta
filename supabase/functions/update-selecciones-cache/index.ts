// @ts-ignore - Deno import URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore - Deno global
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Top 20 FIFA (ejemplo estático; idealmente mantener en settings o actualizar periódicamente)
// Usaremos nombres para filtrar rápidamente; si hay discrepancias de nombre, ajustar a IDs del API
const FIFA_TOP20_NAMES = new Set<string>([
  'Argentina','France','Belgium','England','Brazil','Netherlands','Portugal','Spain','Italy','Croatia',
  'Uruguay','USA','Morocco','Colombia','Mexico','Germany','Switzerland','Senegal','Japan','Iran'
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const footballApiKey = Deno.env.get('API_FOOTBALL_KEY');
    if (!footballApiKey) throw new Error('API_FOOTBALL_KEY is not set');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Example: World Cup Qualification UEFA league = 13? We instead fetch by international friendly/qualification
    // For simplicity: use API endpoint for odds by league=??? or by teams. Here we fetch next N odds for internationals.
    // This is a placeholder approach; adjust league/filters to match desired competitions for Selecciones.
    const nextCount = 20; // fetch next 20 matches
    const response = await fetch(`https://v3.football.api-sports.io/odds?league=1&season=2025&next=${nextCount}`, {
      headers: { 'x-apisports-key': footballApiKey }
    });

    if (!response.ok) {
      throw new Error(`Football API error: ${response.status} ${response.statusText}`);
    }

    const footballData = await response.json();

    // Filtrar solo partidos donde participe alguna selección del top-20
    // Load enabled teams list from betting_settings (optional override)
    const { data: setting } = await supabase
      .from('betting_settings')
      .select('setting_value')
      .eq('setting_key', 'selecciones_enabled_teams')
      .maybeSingle();
    let enabledTeams: Set<string> | null = null;
    if (setting?.setting_value) {
      try {
        const parsed = JSON.parse(setting.setting_value);
        if (Array.isArray(parsed)) enabledTeams = new Set(parsed);
      } catch {}
    }

    const allow = (name?: string) => {
      if (!name) return false;
      if (enabledTeams) return enabledTeams.has(name);
      return FIFA_TOP20_NAMES.has(name);
    };

    const filtered = Array.isArray(footballData?.response)
      ? footballData.response.filter((m: any) => allow(m?.teams?.home?.name) || allow(m?.teams?.away?.name))
      : [];
    const payload = { ...footballData, response: filtered };

    // Write to cache id=2 (Selecciones)
    const { error } = await supabase
      .from('match_odds_cache')
      .upsert({ id: 2, data: payload, last_updated: new Date().toISOString() });
    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, message: 'Selecciones odds cache updated', matches_count: filtered.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


