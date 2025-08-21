import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { NewsManagement } from '@/components/NewsManagement';

interface League {
  id: number;
  name: string;
  join_code: string;
  type: string;
  week: number;
}

interface WeekCounter {
  current_week: number;
}

const Admin: React.FC = () => {
  const { toast } = useToast();

  // Última actualización de caché de cuotas
  const {
    data: lastUpdated,
    isLoading: loadingLastUpdated,
    refetch: refetchLastUpdated,
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

  // Estados generales
  const [updatingOdds, setUpdatingOdds] = React.useState(false);
  const [processingResults, setProcessingResults] = React.useState(false);
  const [resettingBudgets, setResettingBudgets] = React.useState(false);
  const [testingAuth, setTestingAuth] = React.useState(false);
  const [authTestResults, setAuthTestResults] = React.useState<any>(null);
  const [resettingWeek, setResettingWeek] = React.useState(false);

  // Query para ligas
  const {
    data: leagues,
    isLoading: loadingLeagues,
    refetch: refetchLeagues,
  } = useQuery({
    queryKey: ['leagues'],
    queryFn: async () => {
      const { data, error } = await supabase.from<League>('leagues').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Query para contador de semana
  const {
    data: weekCounterData,
    isLoading: loadingWeekCounter,
    refetch: refetchWeekCounter,
  } = useQuery({
    queryKey: ['week-counter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from<WeekCounter>('week_counter') // Cambia por tu tabla o view real
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Funciones de manejo
  const handleForceUpdateOdds = async () => {
    try {
      setUpdatingOdds(true);
      const { error } = await supabase.functions.invoke('secure-run-update-football-cache', { body: {} });
      if (error) throw error;
      toast({ title: 'Actualización forzada', description: 'Se inició la actualización de cuotas.' });
      await refetchLastUpdated();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'No se pudo actualizar las cuotas.', variant: 'destructive' });
    } finally {
      setUpdatingOdds(false);
    }
  };

  const handleForceProcessResults = async () => {
    try {
      setProcessingResults(true);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secure-run-process-matchday-results`;
      const body = JSON.stringify({ trigger: 'admin', timestamp: new Date().toISOString() });
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
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

  const handleResetWeek = async () => {
    try {
      setResettingWeek(true);
      const { error } = await supabase.functions.invoke('reset_week_counter', { body: {} });
      if (error) throw error;
      toast({ title: 'Contador reiniciado', description: 'El contador de semana se ha puesto a 1.' });
      await refetchWeekCounter();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'No se pudo reiniciar el contador.', variant: 'destructive' });
    } finally {
      setResettingWeek(false);
    }
  };

  const testEdgeFunctionAuth = async () => {
    try {
      setTestingAuth(true);
      setAuthTestResults(null);
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const testBody = JSON.stringify({ trigger: 'auth-test', timestamp: new Date().toISOString() });
      const results: any = { publicWrapper: null, protectedFunction: null };

      // Public wrapper test
      try {
        const res1 = await fetch(`${baseUrl}/functions/v1/secure-run-process-matchday-results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: testBody,
        });
        const data1 = res1.ok ? await res1.json() : await res1.text();
        results.publicWrapper = { success: res1.ok, status: res1.status, statusText: res1.statusText, data: data1 };
      } catch (e: any) {
        results.publicWrapper = { success: false, status: 'Network Error', statusText: e.message, data: null };
      }

      // Protected function test
      try {
        const res2 = await fetch(`${baseUrl}/functions/v1/process-matchday-results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: testBody,
        });
        const data2 = res2.ok ? await res2.json() : await res2.text();
        results.protectedFunction = { success: res2.ok, status: res2.status, statusText: res2.statusText, data: data2 };
      } catch (e: any) {
        results.protectedFunction = { success: false, status: 'Network Error', statusText: e.message, data: null };
      }

      setAuthTestResults(results);
      const publicOk = results.publicWrapper?.success;
      const protectedBlocked = !results.protectedFunction?.success &&
        (results.protectedFunction?.status === 401 || results.protectedFunction?.status === 403);
      if (publicOk && protectedBlocked) {
        toast({ title: 'Auth Test: Success', description: 'Public wrapper accesible, protected function properly secured.' });
      } else {
        toast({ title: 'Auth Test: Issues Found', description: 'Check the test results for details.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Auth Test Failed', description: e?.message || 'Failed to run authentication tests.', variant: 'destructive' });
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
        {/* Odds Cache */}
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

        {/* Process Results */}
        <Card>
          <CardHeader>
            <CardTitle>Procesamiento de Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Ejecuta manualmente el procesamiento de resultados de la última jornada.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleForceProcessResults} disabled={processingResults}>
              {processingResults ? 'Procesando…' : 'Forzar procesamiento de resultados'}
            </Button>
          </CardFooter>
        </Card>

        {/* Weekly Budgets */}
        <Card>
          <CardHeader>
            <CardTitle>Presupuestos Semanales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Reinicia el presupuesto semanal de todos los usuarios a 1000.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleResetBudgets} disabled={resettingBudgets}>
              {resettingBudgets ? 'Reiniciando…' : 'Reiniciar todos los presupuestos semanales'}
            </Button>
          </CardFooter>
        </Card>

        {/* Week Counter */}
        <Card>
          <CardHeader>
            <CardTitle>Contador de Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Semana actual: {loadingWeekCounter ? 'Cargando…' : weekCounterData?.current_week ?? 'N/A'}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleResetWeek} disabled={resettingWeek}>
              {resettingWeek ? 'Reiniciando…' : 'Resetear contador'}
            </Button>
          </CardFooter>
        </Card>

        {/* Auth Test */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Test de Autenticación de Edge Functions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Prueba la configuración de autenticación de las Edge Functions para diagnosticar problemas.
            </p>

            {authTestResults && (
              <div className="space-y-4">
                {/* Public Wrapper */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${authTestResults.publicWrapper?.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium">Función Pública (secure-run-process-matchday-results)</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Estado: {authTestResults.publicWrapper?.status} - {authTestResults.publicWrapper?.statusText}
                  </div>
                  <div className="text-sm">
                    {authTestResults.publicWrapper?.success ? (
                      <span className="text-green-600">✓ Accesible sin autenticación (correcto)</span>
                    ) : (
                      <span className="text-red-600">✗ Error: {JSON.stringify(authTestResults.publicWrapper?.data)}</span>
                    )}
                  </div>
                </div>

                {/* Protected Function */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${!authTestResults.protectedFunction?.success && (authTestResults.protectedFunction?.status === 401 || authTestResults.protectedFunction?.status === 403) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium">Función Protegida (process-matchday-results)</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Estado: {authTestResults.protectedFunction?.status} - {authTestResults.protectedFunction?.statusText}
                  </div>
                  <div className="text-sm">
                    {!authTestResults.protectedFunction?.success && (authTestResults.protectedFunction?.status === 401 || authTestResults.protectedFunction?.status === 403) ? (
                      <span className="text-green-600">✓ Bloqueada sin autenticación (correcto)</span>
                    ) : authTestResults.protectedFunction?.success ? (
                      <span className="text-red-600">✗ ERROR: Función protegida es accesible sin autenticación</span>
                    ) : (
                      <span className="text-red-600">✗ Error inesperado: {JSON.stringify(authTestResults.protectedFunction?.data)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
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
