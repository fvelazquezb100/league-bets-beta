import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { NewsManagement } from '@/components/NewsManagement';

const Admin: React.FC = () => {
  const { toast } = useToast();

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

  const handleForceUpdateOdds = async () => {
    try {
      setUpdatingOdds(true);
      const { error } = await supabase.functions.invoke('secure-run-update-football-cache', {
        body: {},
      });
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
      const { error } = await supabase.functions.invoke('secure-run-process-matchday-results', {
        body: {},
      });
      if (error) throw error;
      toast({ title: 'Procesamiento forzado', description: 'Se inició el procesamiento de resultados.' });
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

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground">Herramientas para gestionar cuotas, resultados y presupuestos.</p>
      </header>

      {/* News Management Section */}
      <NewsManagement />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Odds Cache Section */}
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

        {/* Results Processing Section */}
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

        {/* Budget Reset Section */}
        <Card className="md:col-span-2">
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
      </div>
    </div>
  );
};

export default Admin;
