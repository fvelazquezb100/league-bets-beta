import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SuperAdminOtrasLigas: React.FC = () => {
  const { toast } = useToast();

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

      toast({
        title: 'Cuotas actualizadas',
        description: 'Se han actualizado las cuotas de Selecciones y Copa del Rey',
      });
    } catch (error) {
      console.error('Error forcing odds:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar las cuotas',
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
                  Activa la visibilidad de partidos de Selecciones en la página de apuestas
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
                  Activa la visibilidad de partidos de Copa del Rey en la página de apuestas
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
                {forcingOdds ? 'Actualizando cuotas...' : 'Forzar cuotas'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Actualiza las cuotas de Selecciones y Copa del Rey
              </p>
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
