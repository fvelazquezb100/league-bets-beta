import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { NewsManagement } from '@/components/NewsManagement'; // Tarjeta de noticias

const SuperAdmin: React.FC = () => {
  const { toast } = useToast();

  //añadido card para hacer calculo manual de puntos
  
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
  const [testingAuth, setTestingAuth] = React.useState(false);
  const [authTestResults, setAuthTestResults] = React.useState<any>(null);

  // Funciones generales
  const handleForceUpdateOdds = async () => {
    try {
      setUpdatingOdds(true);
      const { data, error } = await supabase.functions.invoke('secure-run-update-football-cache', {
        body: { trigger: 'admin', timestamp: new Date().toISOString() }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Actualización forzada', description: 'Se inició la actualización de cuotas.' });
      await refetch();
    } catch (e: any) {
      console.error('Error updating odds cache:', e);
      toast({ title: 'Error', description: e?.message ?? 'No se pudo actualizar las cuotas.', variant: 'destructive' });
    } finally {
      setUpdatingOdds(false);
    }
  };

  const handleForceProcessResults = async () => {
    try {
      setProcessingResults(true);
      const url = `https://lflxrkkzudsecvdfdxwl.supabase.co/functions/v1/secure-run-process-matchday-results`;
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

  // Test de autenticación
  const testEdgeFunctionAuth = async () => {
    try {
      setTestingAuth(true);
      setAuthTestResults(null);
      const baseUrl = 'https://lflxrkkzudsecvdfdxwl.supabase.co';
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
    <div className="container mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">SuperAdmin</h1>
        <p className="text-muted-foreground">Herramientas de administración global del sistema.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta de Noticias */}
        <CardContent className="md:col-span-2">
          <NewsManagement />
        </CardContent>

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

        {/* Recalcular Total Points */}
        <Card>
          <CardHeader>
            <CardTitle>Recalcular Puntos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ejecuta manualmente el cálculo total de puntos de todos los usuarios, según sus apuestas ganadas.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="destructive"
              onClick={async () => {
                const confirm = window.confirm(
                  '¿Estás seguro? Esto recalculará los puntos totales de todos los usuarios según sus apuestas ganadas.'
                );
                if (!confirm) return;

                try {
                  const { data, error } = await supabase.functions.invoke('recalc_total_points');
                  if (error) throw error;
                  toast({ title: 'Cálculo completado', description: 'Los puntos totales se han recalculado correctamente.' });
                  console.log('Recalc total points result:', data);
                } catch (e: any) {
                  console.error('Error recalculando puntos totales:', e);
                  toast({ title: 'Error', description: e?.message ?? 'No se pudo recalcular los puntos.', variant: 'destructive' });
                }
              }}
            >
              Recalcular Puntos
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
            {authTestResults && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Public Wrapper (secure-run-process-matchday-results):</h4>
                  <div className="text-sm">
                    <div>Status: {authTestResults.publicWrapper?.status} {authTestResults.publicWrapper?.statusText}</div>
                    <div>Success: {authTestResults.publicWrapper?.success ? '✅' : '❌'}</div>
                    <div className="mt-2 font-mono text-xs bg-muted p-2 rounded">
                      {JSON.stringify(authTestResults.publicWrapper?.data, null, 2)}
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Protected Function (process-matchday-results):</h4>
                  <div className="text-sm">
                    <div>Status: {authTestResults.protectedFunction?.status} {authTestResults.protectedFunction?.statusText}</div>
                    <div>Success: {authTestResults.protectedFunction?.success ? '✅' : '❌'}</div>
                    <div className="mt-2 font-mono text-xs bg-muted p-2 rounded">
                      {JSON.stringify(authTestResults.protectedFunction?.data, null, 2)}
                    </div>
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

export default SuperAdmin;