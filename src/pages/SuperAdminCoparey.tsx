import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SuperAdminCoparey: React.FC = () => {
  const { toast } = useToast();

  const [loadingSetting, setLoadingSetting] = React.useState(true);
  const [enabled, setEnabled] = React.useState(false);
  const [forcingOdds, setForcingOdds] = React.useState(false);
  const [forcingResults, setForcingResults] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await (supabase as any)
          .from('betting_settings' as any)
          .select('setting_value' as any)
          .eq('setting_key', 'enable_coparey')
          .maybeSingle();
        setEnabled(((data as any)?.setting_value || 'false') === 'true');
      } finally {
        setLoadingSetting(false);
      }
    })();
  }, []);

  const onToggle = async (checked: boolean) => {
    setEnabled(checked);
    try {
      const { error } = await (supabase as any)
        .from('betting_settings' as any)
        .upsert({ setting_key: 'enable_coparey', setting_value: checked ? 'true' : 'false', description: 'Enable Copa del Rey view and features in app' } as any, { onConflict: 'setting_key' } as any);
      if (error) throw error;
      toast({ title: 'Copa del Rey', description: `Mostrar partidos: ${checked ? 'Activado' : 'Desactivado'}` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      setEnabled(!checked); // revert on error
    }
  };

  const forceOdds = async () => {
    setForcingOdds(true);
    try {
      const { error } = await supabase.functions.invoke('secure-run-update-coparey-cache');
      if (error) throw error;
      toast({ title: 'Copa del Rey', description: 'Cuotas actualizadas' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setForcingOdds(false);
    }
  };

  const forceResults = async () => {
    setForcingResults(true);
    try {
      const { error } = await supabase.functions.invoke('secure-run-process-coparey-results');
      if (error) throw error;
      toast({ title: 'Copa del Rey', description: 'Resultados procesados' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setForcingResults(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Gestionar Copa del Rey</h1>
          <p className="text-muted-foreground">Opciones específicas para apuestas de Copa del Rey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Mostrar partidos</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground">Si está activado, aparece el botón en APOSTAR para todas las ligas.</p>
            </CardContent>
            <CardFooter className="p-3 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm">Desactivado</span>
                <Switch checked={enabled} onCheckedChange={onToggle} disabled={loadingSetting} />
                <span className="text-xs sm:text-sm">Activado</span>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Forzar cuotas</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground">Actualiza manualmente la caché de cuotas de Copa del Rey.</p>
            </CardContent>
            <CardFooter className="p-3 sm:p-6">
              <Button onClick={forceOdds} disabled={forcingOdds} className="jambol-button text-xs sm:text-sm">
                {forcingOdds ? 'Actualizando...' : 'Forzar cuotas'}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Forzar resultados</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground">Procesa los resultados de Copa del Rey.</p>
            </CardContent>
            <CardFooter className="p-3 sm:p-6">
              <Button onClick={forceResults} disabled={forcingResults} className="jambol-button text-xs sm:text-sm">
                {forcingResults ? 'Procesando...' : 'Forzar resultados'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminCoparey;
