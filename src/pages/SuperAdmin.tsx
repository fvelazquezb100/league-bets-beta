import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { NewsManagement } from '@/components/NewsManagement';
import { BettingSettingsControl } from '@/components/BettingSettingsControl';
import { useLastProcessedMatch } from '@/hooks/useLastProcessedMatch';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SuperAdmin: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { consent } = useCookieConsent();
  const { data: lastProcessedMatch, isLoading: loadingLastMatch } = useLastProcessedMatch();
  
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
        .eq('id', 1)
        .single();

      if (error) {
        throw error;
      }

      return data?.last_updated;
    },
  });

  const {
    data: blockSettings,
    isLoading: loadingBlockStats,
    refetch: refetchBlockStats,
  } = useQuery({
    queryKey: ['block-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('betting_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['blocks_available_per_user', 'blocks_received_max_per_user']);

      if (error) {
        throw error;
      }

      const availableSetting = data?.find(s => s.setting_key === 'blocks_available_per_user');
      const blockedSetting = data?.find(s => s.setting_key === 'blocks_received_max_per_user');

      return {
        blocksAvailable: availableSetting ? parseInt(availableSetting.setting_value, 10) : 1,
        blocksReceived: blockedSetting ? parseInt(blockedSetting.setting_value, 10) : 3,
      };
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
  const [testingAuth, setTestingAuth] = React.useState(false);
  const [blockResetDialogOpen, setBlockResetDialogOpen] = React.useState(false);
  const [blocksAvailableInput, setBlocksAvailableInput] = React.useState<number>(0);
  const [blocksBlockedInput, setBlocksBlockedInput] = React.useState<number>(0);
  const [updatingBlockSettings, setUpdatingBlockSettings] = React.useState(false);

  React.useEffect(() => {
    if (blockSettings) {
      setBlocksAvailableInput(blockSettings.blocksAvailable ?? 1);
      setBlocksBlockedInput(blockSettings.blocksReceived ?? 3);
    }
  }, [blockSettings]);

  const handleBlockDialogOpenChange = (open: boolean) => {
    if (updatingBlockSettings) return;
    setBlockResetDialogOpen(open);
  };

  const handleApplyBlockSettings = async () => {
    try {
      setUpdatingBlockSettings(true);

      const availableValue = Math.max(0, Math.floor(blocksAvailableInput));
      const receivedValue = Math.max(0, Math.floor(blocksBlockedInput));

      // Update both settings using upsert
      const { error: error1 } = await supabase
        .from('betting_settings')
        .upsert({
          setting_key: 'blocks_available_per_user',
          setting_value: availableValue.toString(),
          description: 'Number of matches each user can block per week',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'setting_key',
        });

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('betting_settings')
        .upsert({
          setting_key: 'blocks_received_max_per_user',
          setting_value: receivedValue.toString(),
          description: 'Maximum number of blocks a user can receive from others',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'setting_key',
        });

      if (error2) throw error2;

      // Execute reset function to apply values to all users
      const { data: resetResult, error: resetError } = await supabase.rpc('reset_block_counters');

      if (resetError) throw resetError;

      const result = resetResult as { success?: boolean; error?: string; updated_profiles?: number };
      
      if (result && result.success === false) {
        throw new Error(result.error || 'Error al resetear contadores');
      }

      await refetchBlockStats();

      const updatedCount = result?.updated_profiles ?? 0;
      toast({
        title: 'Bloqueos actualizados',
        description: `Los valores se actualizaron y aplicaron a ${updatedCount} usuarios correctamente.`,
      });

      setBlockResetDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error al actualizar bloqueos',
        description: error?.message ?? 'No se pudo completar la actualización.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingBlockSettings(false);
    }
  };

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

        {/* News Management, Betting Settings - 3 columns on desktop with equal card heights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* News Management */}
          <div className="lg:col-span-1 h-full">
            <NewsManagement />
          </div>
          
          {/* Configuración de Tiempo de Apuestas */}
          <div className="lg:col-span-1 h-full">
            <BettingSettingsControl />
          </div>
          
          {/* Gestión de Selecciones */}
          <div className="lg:col-span-1 h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Gestionar otras ligas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 sm:p-6">
                <p className="text-xs sm:text-sm text-muted-foreground">Configura la visibilidad y acciones para otras ligas</p>
              </CardContent>
              <CardFooter className="p-3 sm:p-6">
                <Button className="jambol-button text-xs sm:text-sm" onClick={() => navigate('/superadmin-otras-ligas')}>
                  Abrir gestión de otras ligas
                </Button>
              </CardFooter>
            </Card>
          </div>

        </div>

        {/* Cache de Cuotas and Procesamiento de Resultados - 3 columns on desktop with equal card heights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Caché de Cuotas */}
          <Card className="h-full">
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
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Procesamiento de Resultados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Ejecuta manualmente el procesamiento de resultados de la última jornada.
              </p>
              
              {/* Último partido procesado */}
              {loadingLastMatch ? (
                <p className="text-xs text-muted-foreground">Cargando último partido...</p>
              ) : lastProcessedMatch ? (
                <p className="text-xs text-muted-foreground">
                  Último partido: {lastProcessedMatch.home_team} vs {lastProcessedMatch.away_team} {new Date(new Date(lastProcessedMatch.finished_at).getTime() + 2 * 60 * 60 * 1000).toLocaleString('es-ES')}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No hay partidos procesados aún</p>
              )}
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

          {/* Test de Autenticación de Edge Functions */}
          <Card className="h-full">
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

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Bloqueo de Partidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3 sm:p-6">
              {loadingBlockStats ? (
                 <p className="text-xs sm:text-sm text-muted-foreground">Cargando estadísticas...</p>
               ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="blocks-available-input" className="text-xs sm:text-sm text-muted-foreground">
                      Partidos para bloquear
                    </Label>
                    <Input
                      id="blocks-available-input"
                      type="number"
                      min={0}
                      value={blocksAvailableInput}
                      onChange={(event) => setBlocksAvailableInput(Number(event.target.value || 0))}
                      disabled={loadingBlockStats || updatingBlockSettings}
                      className="w-20 h-8 text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="blocks-blocked-input" className="text-xs sm:text-sm text-muted-foreground">
                      Máx. partidos bloqueados
                    </Label>
                    <Input
                      id="blocks-blocked-input"
                      type="number"
                      min={0}
                      value={blocksBlockedInput}
                      onChange={(event) => setBlocksBlockedInput(Number(event.target.value || 0))}
                      disabled={loadingBlockStats || updatingBlockSettings}
                      className="w-20 h-8 text-right"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-3 sm:p-6">
              <AlertDialog open={blockResetDialogOpen} onOpenChange={handleBlockDialogOpenChange}>
                <AlertDialogTrigger asChild>
                  <Button
                    className="jambol-button text-xs sm:text-sm"
                    onClick={() => setBlockResetDialogOpen(true)}
                    disabled={loadingBlockStats}
                  >
                    Forzar actualización
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Aplicar nueva configuración global</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se actualizarán los valores de configuración y se aplicarán inmediatamente a todos los usuarios del sistema.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={updatingBlockSettings}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="jambol-button"
                      onClick={handleApplyBlockSettings}
                      disabled={updatingBlockSettings}
                    >
                      {updatingBlockSettings ? 'Actualizando...' : 'Aceptar'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>


      </div>
    </div>
  );
};

export default SuperAdmin;