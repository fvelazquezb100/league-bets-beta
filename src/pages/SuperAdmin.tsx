import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { NewsManagement } from '@/components/NewsManagement';
import { BettingSettingsControl } from '@/components/BettingSettingsControl';
import { useMatchAvailability } from '@/hooks/useMatchAvailability';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const SuperAdmin: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: matchAvailability = [] } = useMatchAvailability();

  // Calculate active days count
  const activeDaysCount = matchAvailability.filter(item => item.is_live_betting_enabled).length;
  
  // Caché de cuotas
  const {
    data: lastUpdated,
    isLoading: loadingLastUpdated,
    refetch,
  } = useQuery({
    queryKey: ['lastUpdated'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_odds_cache')
        .select('last_updated')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        throw error;
      }

      return data?.last_updated;
    },
  });

  const updateCache = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('secure-run-update-football-cache');

      if (error) {
        throw error;
      }

      toast({
        title: 'Actualización de Caché',
        description: 'Caché de cuotas actualizado exitosamente',
      });
      
      // Refetch the last updated time
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error en Actualización',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const processResults = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('secure-run-process-matchday-results', {
        body: { force: true },
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Procesamiento de Resultados',
        description: 'Resultados procesados exitosamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error en Procesamiento',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const recalculatePoints = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-budgets', {
        body: { recalculate: true },
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Recálculo de Puntos',
        description: 'Puntos recalculados exitosamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error en Recálculo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const testEdgeFunctionAuth = async () => {
    try {
      // Test with a simple function that we know works
      const { data, error } = await supabase.functions.invoke('secure-run-update-football-cache', {
        body: { test: true },
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Edge Function Auth Test',
        description: `Success: Edge Functions are working correctly`,
      });
    } catch (error: any) {
      toast({
        title: 'Edge Function Auth Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };


  const [updatingCache, setUpdatingCache] = React.useState(false);
  const [processingResults, setProcessingResults] = React.useState(false);
  const [recalculatingPoints, setRecalculatingPoints] = React.useState(false);
  const [testingAuth, setTestingAuth] = React.useState(false);

  const handleUpdateCache = async () => {
    setUpdatingCache(true);
    try {
      await updateCache();
    } finally {
      setUpdatingCache(false);
    }
  };

  const handleProcessResults = async () => {
    setProcessingResults(true);
    try {
      await processResults();
    } finally {
      setProcessingResults(false);
    }
  };

  const handleRecalculatePoints = async () => {
    setRecalculatingPoints(true);
    try {
      await recalculatePoints();
    } finally {
      setRecalculatingPoints(false);
    }
  };

  const handleTestAuth = async () => {
    setTestingAuth(true);
    try {
      await testEdgeFunctionAuth();
    } finally {
      setTestingAuth(false);
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Panel de Superadministrador</h1>
          <p className="text-muted-foreground">
            Gestiona la configuración global de la aplicación
          </p>
        </div>

        {/* News Management - Full width at top */}
        <NewsManagement />

        {/* Cache de Cuotas and Procesamiento de Resultados - Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Caché de Cuotas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Caché de Cuotas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Última actualización: {loadingLastUpdated ? 'Cargando...' : lastUpdated ? new Date(lastUpdated).toLocaleString('es-ES') : 'Nunca'}
              </p>
            </CardContent>
            <CardFooter className="p-3 sm:p-6">
              <Button 
                onClick={handleUpdateCache}
                disabled={updatingCache}
                className="jambol-button text-xs sm:text-sm"
              >
                {updatingCache ? 'Actualizando...' : 'Forzar actualización de cuotas'}
              </Button>
            </CardFooter>
          </Card>

          {/* Procesamiento de Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Procesamiento de Resultados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Ejecuta manualmente el procesamiento de resultados de la última jornada.
              </p>
            </CardContent>
            <CardFooter className="p-3 sm:p-6">
              <Button 
                onClick={handleProcessResults}
                disabled={processingResults}
                className="jambol-button text-xs sm:text-sm"
              >
                {processingResults ? 'Procesando...' : 'Forzar procesamiento de resultados'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Recalcular Puntos Totales y Test - Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recalcular Puntos Totales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Recalcular Puntos Totales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Ejecuta manualmente el cálculo total de puntos de todos los usuarios, según sus apuestas ganadas.
              </p>
            </CardContent>
            <CardFooter className="p-3 sm:p-6">
              <Button 
                onClick={handleRecalculatePoints}
                disabled={recalculatingPoints}
                className="jambol-button text-xs sm:text-sm"
              >
                {recalculatingPoints ? 'Recalculando...' : 'Recalcular Puntos'}
              </Button>
            </CardFooter>
          </Card>


          {/* Test de Autenticación de Edge Functions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Test de Autenticación de Edge Functions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Prueba la configuración de autenticación de las Edge Functions para diagnosticar problemas.
              </p>
            </CardContent>
            <CardFooter className="p-3 sm:p-6">
              <Button 
                onClick={handleTestAuth} 
                disabled={testingAuth} 
                className="jambol-button text-xs sm:text-sm"
              >
                {testingAuth ? 'Probando...' : 'Test Edge Function Auth'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* New controls at the bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración de Tiempo de Apuestas */}
          <BettingSettingsControl />

          {/* Control de Disponibilidad de Partidos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Control de Disponibilidad de Partidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Días activos en los próximos 15 días: <strong>{activeDaysCount} días</strong>
              </p>
            </CardContent>
            <CardFooter className="p-3 sm:p-6">
              <Button 
                onClick={() => navigate('/match-availability-control')}
                className="jambol-button text-xs sm:text-sm"
              >
                Abrir Control de Disponibilidad
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;