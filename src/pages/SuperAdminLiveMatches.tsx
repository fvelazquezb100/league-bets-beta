import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type LiveFixtureConfig = {
  fixture_id: number;
  kickoff_time: string;
  home_team: string;
  away_team: string;
  league_id?: number;
  league_name?: string;
};

const SETTINGS_KEY = 'live_matches_selected';
const ENABLED_KEY = 'live_matches_enabled';

const safeString = (v: any) => (typeof v === 'string' ? v : v == null ? '' : String(v));

const SuperAdminLiveMatches: React.FC = () => {
  const { toast } = useToast();

  React.useEffect(() => {
    document.title = 'Jambol — Partidos en directo (config)';
  }, []);

  const { data: selectedConfig = [], refetch: refetchSelected } = useQuery({
    queryKey: ['betting-setting', SETTINGS_KEY],
    queryFn: async (): Promise<LiveFixtureConfig[]> => {
      const { data, error } = await supabase
        .from('betting_settings')
        .select('setting_value')
        .eq('setting_key', SETTINGS_KEY)
        .maybeSingle();
      if (error) throw error;
      const raw = (data as any)?.setting_value;
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    staleTime: 10_000,
  });

  const { data: liveEnabled = false, refetch: refetchEnabled } = useQuery({
    queryKey: ['betting-setting', ENABLED_KEY],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('betting_settings')
        .select('setting_value')
        .eq('setting_key', ENABLED_KEY)
        .maybeSingle();
      if (error) throw error;
      return (((data as any)?.setting_value || 'false') === 'true');
    },
    staleTime: 10_000,
  });

  const [togglingEnabled, setTogglingEnabled] = React.useState(false);
  const setEnabled = async (checked: boolean) => {
    setTogglingEnabled(true);
    try {
      const { error } = await supabase
        .from('betting_settings')
        .upsert(
          {
            setting_key: ENABLED_KEY,
            setting_value: checked.toString(),
            description: 'Enable/disable Live Matches page (/directo)',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' },
        );
      if (error) throw error;
      await refetchEnabled();
      toast({
        title: 'Configuración actualizada',
        description: checked ? 'Partidos en directo activados.' : 'Partidos en directo desactivados.',
      });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo actualizar el estado.',
        variant: 'destructive',
      });
    } finally {
      setTogglingEnabled(false);
    }
  };

  const selectedIds = React.useMemo(() => new Set(selectedConfig.map((x) => x.fixture_id)), [selectedConfig]);

  // Load fixtures from all current odds caches we already have
  const { data: availableFixtures = [], isLoading: loadingFixtures } = useQuery({
    queryKey: ['live-matches', 'available-fixtures-from-cache'],
    queryFn: async (): Promise<LiveFixtureConfig[]> => {
      const { data, error } = await supabase
        .from('match_odds_cache')
        .select('id, data')
        .in('id', [1, 3, 5, 7]);
      if (error) throw error;

      const byId = new Map<number, LiveFixtureConfig>();

      (data || []).forEach((row: any) => {
        const resp = row?.data?.response;
        if (!Array.isArray(resp)) return;

        resp.forEach((m: any) => {
          const fixtureId = m?.fixture?.id;
          const kickoff = m?.fixture?.date;
          const home = m?.teams?.home?.name;
          const away = m?.teams?.away?.name;

          if (!fixtureId || !kickoff || !home || !away) return;

          const leagueId = m?.league?.id ?? m?.teams?.league_id ?? undefined;
          const leagueName = m?.league?.name ?? m?.teams?.league_name ?? undefined;

          if (!byId.has(fixtureId)) {
            byId.set(fixtureId, {
              fixture_id: Number(fixtureId),
              kickoff_time: safeString(kickoff),
              home_team: safeString(home),
              away_team: safeString(away),
              league_id: typeof leagueId === 'number' ? leagueId : undefined,
              league_name: leagueName ? safeString(leagueName) : undefined,
            });
          }
        });
      });

      return Array.from(byId.values()).sort(
        (a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime(),
      );
    },
    staleTime: 30_000,
  });

  const [localSelected, setLocalSelected] = React.useState<Set<number>>(new Set());
  const [leagueFilter, setLeagueFilter] = React.useState<string>('all');

  React.useEffect(() => {
    setLocalSelected(new Set(Array.from(selectedIds)));
  }, [selectedIds]);

  const leagueOptions = React.useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    availableFixtures.forEach((f) => {
      const key = f.league_id != null ? `id:${f.league_id}` : f.league_name ? `name:${f.league_name}` : 'unknown';
      const label = f.league_name ? f.league_name : f.league_id != null ? `Liga ${f.league_id}` : 'Sin liga';
      const prev = map.get(key);
      map.set(key, { label, count: (prev?.count ?? 0) + 1 });
    });

    return Array.from(map.entries())
      .map(([value, meta]) => ({ value, label: `${meta.label} (${meta.count})` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availableFixtures]);

  const filteredFixtures = React.useMemo(() => {
    if (leagueFilter === 'all') return availableFixtures;
    if (leagueFilter === 'unknown') {
      return availableFixtures.filter((f) => !f.league_id && !f.league_name);
    }
    if (leagueFilter.startsWith('id:')) {
      const id = Number(leagueFilter.slice(3));
      return availableFixtures.filter((f) => f.league_id === id);
    }
    if (leagueFilter.startsWith('name:')) {
      const name = leagueFilter.slice(5);
      return availableFixtures.filter((f) => f.league_name === name);
    }
    return availableFixtures;
  }, [availableFixtures, leagueFilter]);

  const toggle = (fixtureId: number) => {
    setLocalSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fixtureId)) next.delete(fixtureId);
      else next.add(fixtureId);
      return next;
    });
  };

  const [saving, setSaving] = React.useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const selected = availableFixtures.filter((f) => localSelected.has(f.fixture_id));
      const { error } = await supabase
        .from('betting_settings')
        .upsert(
          {
            setting_key: SETTINGS_KEY,
            setting_value: JSON.stringify(selected),
            description: 'Fixtures enabled for the Live Matches page (/directo)',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' },
        );
      if (error) throw error;

      await refetchSelected();
      toast({ title: 'Guardado', description: 'Se actualizó la configuración de partidos en directo.' });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo guardar la configuración.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Partidos en directo</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona qué partidos (de los que ya tenemos en caché de cuotas) aparecerán en la sección <b>En directo</b>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partidos disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/20">
            <div>
              <div className="text-sm font-semibold">Activar Partidos en directo</div>
              <div className="text-xs text-muted-foreground">
                Si está desactivado, la pestaña <b>En directo</b> no refresca cuotas ni permite operar.
              </div>
            </div>
            <Switch
              checked={liveEnabled}
              onCheckedChange={setEnabled}
              disabled={togglingEnabled}
            />
          </div>

          {loadingFixtures ? (
            <div className="text-sm text-muted-foreground">Cargando partidos…</div>
          ) : availableFixtures.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay partidos en caché.</div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3 pb-2">
                <div className="text-sm text-muted-foreground whitespace-nowrap">Filtrar por liga:</div>
                <div className="w-full max-w-sm">
                  <Select value={leagueFilter} onValueChange={setLeagueFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {leagueOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="unknown">Sin liga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredFixtures.map((f) => {
                const checked = localSelected.has(f.fixture_id);
                return (
                  <label
                    key={f.fixture_id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-background hover:bg-muted/30 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox checked={checked} onCheckedChange={() => toggle(f.fixture_id)} />
                      <div>
                        <div className="text-sm font-semibold">
                          {f.home_team} vs {f.away_team}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(f.kickoff_time).toLocaleString('es-ES')}
                          {f.league_name ? ` · ${f.league_name}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">#{f.fixture_id}</div>
                  </label>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button className="jambol-button" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SuperAdminLiveMatches;


