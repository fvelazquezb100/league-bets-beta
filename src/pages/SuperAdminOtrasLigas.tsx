import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCookieConsent } from '@/hooks/useCookieConsent';

const SuperAdminOtrasLigas: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { consent } = useCookieConsent();

  React.useEffect(() => {
    document.title = 'Jambol — Gestionar Otras Ligas';
  }, []);

  React.useEffect(() => {
    if (!consent?.analytics) {
      return;
    }

    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-N8SYMCJED4';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-N8SYMCJED4');
    `;
    document.head.appendChild(script2);

    return () => {
      if (script1.parentNode) {
        script1.parentNode.removeChild(script1);
      }
      if (script2.parentNode) {
        script2.parentNode.removeChild(script2);
      }
    };
  }, [consent?.analytics]);

  const [loadingSetting, setLoadingSetting] = React.useState(true);
  const [seleccionesEnabled, setSeleccionesEnabled] = React.useState(false);
  const [copareyEnabled, setCopareyEnabled] = React.useState(false);
  const [forcingOdds, setForcingOdds] = React.useState(false);
  const [forcingResults, setForcingResults] = React.useState(false);
  const TEAMS: string[] = [
    'Spain', 'France', 'Argentina', 'England', 'Portugal', 'Brazil', 'Netherlands', 'Belgium', 'Croatia', 'Italy',
    'Morocco', 'Germany', 'Colombia', 'Mexico', 'Uruguay', 'USA', 'Switzerland', 'Senegal', 'Japan', 'Denmark'
  ];
  const [enabledTeams, setEnabledTeams] = React.useState<string[]>(TEAMS);

  // Hook para obtener la fecha de última actualización de multiplicadores (fila 3 de match_odds_cache)
  const { data: lastOddsUpdate, isLoading: loadingLastUpdate } = useQuery({
    queryKey: ['last-odds-update'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_odds_cache')
        .select('last_updated')
        .eq('id', 3) // Fila 3 corresponde a Selecciones (current)
        .single();

      if (error) {
        console.error('Error fetching last odds update:', error);
        return null;
      }

      return data?.last_updated;
    },
    staleTime: 0, // Always consider stale to get fresh data
  });

  // Función para convertir UTC a hora local y formatear
  const formatLastUpdate = (utcDateString: string | null) => {
    if (!utcDateString) return 'No disponible';
    
    try {
      const utcDate = new Date(utcDateString);
      
      if (isNaN(utcDate.getTime())) {
        return 'Fecha inválida';
      }
      
      return utcDate.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error al formatear fecha';
    }
  };

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch Selecciones setting
        const { data: seleccionesData, error: seleccionesError } = await supabase
          .from('betting_settings')
          .select('setting_value')
          .eq('setting_key', 'enable_selecciones')
          .single();

        if (seleccionesError && seleccionesError.code !== 'PGRST116') {
          throw seleccionesError;
        }

        setSeleccionesEnabled(seleccionesData?.setting_value === 'true');

        // Fetch Copa del Rey setting
        const { data: copareyData, error: copareyError } = await supabase
          .from('betting_settings')
          .select('setting_value')
          .eq('setting_key', 'enable_coparey')
          .single();

        if (copareyError && copareyError.code !== 'PGRST116') {
          throw copareyError;
        }

        setCopareyEnabled(copareyData?.setting_value === 'true');
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la configuración',
          variant: 'destructive',
        });
      } finally {
        setLoadingSetting(false);
      }
    };

    fetchSettings();
  }, [toast]);

  React.useEffect(() => {
    const fetchEnabledTeams = async () => {
      try {
        const { data, error } = await supabase
          .from('betting_settings')
          .select('setting_value')
          .eq('setting_key', 'selecciones_enabled_teams')
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data?.setting_value) {
          try {
            const parsed = JSON.parse(data.setting_value);
            if (Array.isArray(parsed)) {
              setEnabledTeams(parsed);
            }
          } catch (parseError) {
            console.error('Error parsing teams:', parseError);
          }
        }
      } catch (error) {
        console.error('Error fetching enabled teams:', error);
      }
    };

    fetchEnabledTeams();
  }, []);

  const handleSeleccionesToggle = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('betting_settings')
        .update({ setting_value: checked.toString() })
        .eq('setting_key', 'enable_selecciones');

      if (error) {
        throw error;
      }

      setSeleccionesEnabled(checked);
      toast({
        title: 'Configuración actualizada',
        description: `Selecciones ${checked ? 'habilitadas' : 'deshabilitadas'}`,
      });
    } catch (error) {
      console.error('Error updating selecciones setting:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la configuración de Selecciones',
        variant: 'destructive',
      });
    }
  };

  const handleCopareyToggle = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('betting_settings')
        .update({ setting_value: checked.toString() })
        .eq('setting_key', 'enable_coparey');

      if (error) {
        throw error;
      }

      setCopareyEnabled(checked);
      toast({
        title: 'Configuración actualizada',
        description: `Copa del Rey ${checked ? 'habilitada' : 'deshabilitada'}`,
      });
    } catch (error) {
      console.error('Error updating coparey setting:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la configuración de Copa del Rey',
        variant: 'destructive',
      });
    }
  };

  const handleForceOdds = async () => {
    setForcingOdds(true);
    try {
      const { error } = await supabase.functions.invoke('secure-run-update-selecciones-cache');

      if (error) {
        throw error;
      }

      // Refrescar la fecha de última actualización
      queryClient.invalidateQueries({ queryKey: ['last-odds-update'] });

      toast({
        title: 'Multiplicadores actualizados',
        description: 'Se han actualizado los multiplicadores de Selecciones y Copa del Rey',
      });
    } catch (error) {
      console.error('Error forcing odds:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar los multiplicadores',
        variant: 'destructive',
      });
    } finally {
      setForcingOdds(false);
    }
  };

  const handleForceResults = async () => {
    setForcingResults(true);
    try {
      const { error } = await supabase.functions.invoke('secure-run-process-selecciones-results');

      if (error) {
        throw error;
      }

      toast({
        title: 'Resultados procesados',
        description: 'Se han procesado los resultados de Selecciones y Copa del Rey',
      });
    } catch (error) {
      console.error('Error forcing results:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron procesar los resultados',
        variant: 'destructive',
      });
    } finally {
      setForcingResults(false);
    }
  };

  const handleTeamToggle = (team: string) => {
    const newEnabledTeams = enabledTeams.includes(team)
      ? enabledTeams.filter(t => t !== team)
      : [...enabledTeams, team];
    
    setEnabledTeams(newEnabledTeams);
  };

  const handleSaveTeams = async () => {
    try {
      const { error } = await supabase
        .from('betting_settings')
        .update({ setting_value: JSON.stringify(enabledTeams) })
        .eq('setting_key', 'selecciones_enabled_teams');

      if (error) {
        throw error;
      }

      toast({
        title: 'Equipos guardados',
        description: 'Se han guardado los equipos habilitados',
      });
    } catch (error) {
      console.error('Error saving teams:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los equipos',
        variant: 'destructive',
      });
    }
  };

  if (loadingSetting) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando configuración...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestionar otras ligas</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración principal */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de visibilidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Selecciones</h3>
                <p className="text-sm text-muted-foreground">
                  Activa la visibilidad de partidos de Selecciones en la página de partidos
                </p>
              </div>
              <Switch
                checked={seleccionesEnabled}
                onCheckedChange={handleSeleccionesToggle}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Copa del Rey</h3>
                <p className="text-sm text-muted-foreground">
                  Activa la visibilidad de partidos de Copa del Rey en la página de partidos
                </p>
              </div>
              <Switch
                checked={copareyEnabled}
                onCheckedChange={handleCopareyToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                onClick={handleForceOdds}
                disabled={forcingOdds}
                className="w-full jambol-button"
              >
                {forcingOdds ? 'Actualizando multiplicadores...' : 'Forzar multiplicadores'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Actualiza los multiplicadores de Selecciones y Copa del Rey
              </p>
              <div className="text-xs text-muted-foreground border-t pt-2">
                <p className="font-medium">Última actualización:</p>
                <p className="text-xs">
                  {loadingLastUpdate ? 'Cargando...' : formatLastUpdate(lastOddsUpdate)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                onClick={handleForceResults}
                disabled={forcingResults}
                className="w-full jambol-button"
              >
                {forcingResults ? 'Procesando resultados...' : 'Forzar resultados'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Procesa los resultados de Selecciones y Copa del Rey
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de equipos habilitados */}
      <Card>
        <CardHeader>
          <CardTitle>Equipos habilitados para Selecciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {TEAMS.map((team) => (
              <div key={team} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={team}
                  checked={enabledTeams.includes(team)}
                  onChange={() => handleTeamToggle(team)}
                  className="rounded"
                />
                <label htmlFor={team} className="text-sm">
                  {team}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSaveTeams} 
            className="w-full jambol-button"
          >
            Guardar equipos
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SuperAdminOtrasLigas;
