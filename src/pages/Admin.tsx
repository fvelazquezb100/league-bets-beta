import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { NewsManagement } from '@/components/NewsManagement';

type ProfileRow = {
  league_id: number;
};

type LeagueRow = {
  id: number;
  name: string;
  week: number;
};

const Admin: React.FC = () => {
  const { toast } = useToast();

  // Caché de cuotas
  const {
    data: lastUpdated,
    isLoading: loadingLastUpdated,
    refetch,
  } = useQuery({
    queryKey: ['odds-cache-last-updated'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_odds_cache')
        .select('last_updated')
        .eq('id', 1)
        .single();
      if (error) throw error;
      return data?.last_updated as string | null;
    },
  });

  const [updatingOdds, setUpdatingOdds] = React.useState(false);
  const [processingResults, setProcessingResults] = React.useState(false);
  const [resettingBudgets, setResettingBudgets] = React.useState(false);
  const [testingAuth, setTestingAuth] = React.useState(false);
  const [authTestResults, setAuthTestResults] = React.useState<any>(null);

  // Semana de la Liga
  const [currentWeek, setCurrentWeek] = React.useState<number | null>(null);
  const [leagueName, setLeagueName] = React.useState<string | null>(null);
  const [loadingWeek, setLoadingWeek] = React.useState(true);
  const [resettingWeek, setResettingWeek] = React.useState(false);
  const [leagueId, setLeagueId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchWeek = async () => {
      try {
        setLoadingWeek(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        // Perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('league_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (!profileData) throw new Error('Perfil no encontrado');

        const profile = profileData as ProfileRow;
        setLeagueId(profile.league_id);

        // Liga
        const { data: leagueData, error: leagueError } = await supabase
          .from('leagues')
          .select('id, name, week')
          .eq('id', profile.league_id)
          .single();

        if (leagueError) throw leagueError;
        if (!leagueData) throw new Error('Liga no encontrada');

        const league = leagueData as LeagueRow;
        setLeagueName(league.name);
        setCurrentWeek(league.week);
      } catch (e: any) {
        console.error(e);
        setCurrentWeek(null);
        setLeagueName(null);
      } finally {
        setLoadingWeek(false);
      }
    };

    fetchWeek();
  }, []);

  const handleResetWeek = async () => {
    if (!leagueId) return;
    try {
      setResettingWeek(true);

      const { error } = await supabase
        .from('leagues')
        .update({ week: 1 })
        .eq('id', leagueId);
      if (error) throw error;

      toast({
        title: 'Semana reseteada',
        description: `La semana de ${leagueName} fue reiniciada correctamente.`,
      });

      setCurrentWeek(1);
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo resetear la semana.',
        variant: 'destructive',
      });
    } finally {
      setResettingWeek(false);
    }
  };

  // Funciones generales
  const handleForceUpdateOdds = async () => {
    try {
      setUpdatingOdds(true);
      const { error } = await supabase.functions.invoke('secure-run-update-football-cache', { body: {} });
      if (error) throw error;
      toast({ title: 'Actualización forzada', description: 'Se inició la actualización de cuotas.' });
      await refetch();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'No se pudo actualizar las cuotas.', variant: 'destructive' });
    } finally {
      setUpdatingOdds(false);
    }
  };

  const handleForceProcessResults = async () => {
    try {
      setProcessingResults(true);
      const url = `https://jhsjszflscbpcfzuurwq.supabase.co/functions/v1/secure-run-process-matchday-results`;
      const body = JSON.stringify({ trigger: 'admin', timestamp: new Date().toISOString() });
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      await response.json();
      toast({ title: 'Procesamiento forzado', description: 'Se inició el procesamiento de resultados correctamente.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'No se pudo procesar los resultados.', variant: 'destructive' });
    } finally {
      setProcessingResults(false);
    }
  };

  const handleResetBudgets = async () => {
    try {
      setResettingBudgets(true);
      const { error } = await supabase.functions.invoke('admin-reset-budgets', { body: {} });
      if (error) throw error;
      toast({ title: 'Presupuestos reiniciados', description: 'Todos los presupuestos semanales fueron reiniciados a 1000.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'No se pudo reiniciar los presupuestos.', variant: 'destructive' });
    } finally {
      setResettingBudgets(false);
    }
  };

  // Test de autenticación
  const testEdgeFunctionAuth = async () => {
    try {
      setTestingAuth(true);
      setAuthTestResults(null);
      const baseUrl = 'https://jhsjszflscbpcfzuurwq.supabase.co';
      const testBody = JSON.stringify({ trigger: 'auth-test', timestamp: new Date().toISOString() });
      const results = { publicWrapper: null as any, protectedFunction: null as any };

      // Public wrapper
      try {
        const response1 = await fetch(`${baseUrl}/functions/v1/secure-run-process-matchday-results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: testBody,
        });
        results.publicWrapper = {
          success: response1.ok,
          status: response1.status,
          statusText: response1.statusText,
          data: response1.ok ? await response1.json() : await response1.text(),
        };
      } catch (e: any) {
        results.publicWrapper = { success: false, status: 'Network Error', statusText: e.message, data: null };
      }

      // Protected function
      try {
        const response2 = await fetch(`${baseUrl}/functions/v1/process-matchday-results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: testBody,
        });
        results.protectedFunction = {
          success: response2.ok,
          status: response2.status,
          statusText: response2.statusText,
          data: response2.ok ? await response2.json() : await response2.text(),
        };
      } catch (e: any) {
        results.protectedFunction = { success: false, status: 'Network Error', statusText: e.message, data: null };
      }

      setAuthTestResults(results);

      const publicOk = results.publicWrapper?.success;
      const protectedBlocked = !results.protectedFunction?.success &&
                               (results.protectedFunction?.status === 401 || results.protectedFunction?.status === 403);

      if (publicOk && protectedBlocked) {
        toast({ title: 'Auth Test: Success', description: 'Public wrapper accessible, protected function properly secured.' });
      } else {
        toast({ title: 'Auth Test: Issues Found', description: 'Check the test results below for details.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Auth Test Failed', description: e?.message ?? 'Failed to run authentication tests.', variant: 'destructive' });
    } finally {
      setTestingAuth(false);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground">Herramientas para gestionar cuotas, resultados y presupuestos.</p>
      </header>

      <NewsManagement />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Caché de cuotas */}
        <Card>
          <CardHeader>
            <CardTitle>Caché de Cuotas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Última actualización: {loadingLastUpdated ? 'Cargando…' : lastUpdated ? new Date(lastUpdated).toLocaleString() : 'No disponible'}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleForceUpdateOdds} disabled={updatingOdds}>
              {updatingOdds ? 'Actualizando…' : 'Forzar actualización de cuotas'}
            </Button>
          </CardFooter>
        </Card>

        {/* Procesamiento de resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Procesamiento de Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ejecuta manualmente el procesamiento de resultados de la última jornada.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleForceProcessResults} disabled={processingResults}>
              {processingResults ? 'Procesando…' : 'Forzar procesamiento de resultados'}
            </Button>
          </CardFooter>
        </Card>

        {/* Presupuestos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Presupuestos Semanales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Reinicia el presupuesto semanal de todos los usuarios a 1000.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleResetBudgets} disabled={resettingBudgets}>
              {resettingBudgets ? 'Reiniciando…' : 'Reiniciar todos los presupuestos semanales'}
            </Button>
          </CardFooter>
        </Card>

        {/* Semana de la Liga */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Semana de la Liga</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWeek ? (
              <p className="text-sm text-muted-foreground">Cargando semana…</p>
            ) : currentWeek !== null ? (
              <p className="text-sm">
                Semana actual de <span className="font-semibold">{leagueName}</span>: <span className="font-bold">#{currentWeek}</span>
              </p>
            ) : (
              <p className="text-sm text-red-600">No se pudo obtener la semana actual.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleResetWeek} disabled={resettingWeek}>
              {resettingWeek ? 'Reseteando…' : 'Resetear Semana de la Liga'}
            </Button>
          </CardFooter>
        </Card>

        {/* Test de autenticación */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Test de Autenticación de Edge Functions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Prueba la configuración de autenticación de las Edge Functions para diagnosticar problemas.
            </p>
            {/* ... Aquí va el contenido del test, igual que antes ... */}
          </CardContent>
          <CardFooter>
            <Button onClick={testEdgeFunctionAuth} disabled={testingAuth}>
              {testingAuth ? 'Probando autenticación…' : 'Test Edge Function Auth'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
