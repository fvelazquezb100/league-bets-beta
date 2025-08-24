import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy } from 'lucide-react';

type ProfileRow = {
  league_id: number;
};

type LeagueRow = {
  id: number;
  name: string;
  week: number;
  budget: number;
  min_bet: number;
  max_bet: number;
  type: string;
  reset_budget: string;
  join_code: string;
};

const AdminLiga: React.FC = () => {
  const { toast } = useToast();

  const [resettingBudgets, setResettingBudgets] = React.useState(false);
  const [currentWeek, setCurrentWeek] = React.useState<number | null>(null);
  const [leagueName, setLeagueName] = React.useState<string | null>(null);
  const [loadingWeek, setLoadingWeek] = React.useState(true);
  const [resettingWeek, setResettingWeek] = React.useState(false);
  const [leagueId, setLeagueId] = React.useState<number | null>(null);
  const [leagueData, setLeagueData] = React.useState<LeagueRow | null>(null);

  React.useEffect(() => {
    const fetchWeek = async () => {
      try {
        setLoadingWeek(true);

        const { data: { user } } = await supabase.auth.getUser();
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
          .select('id, name, week, budget, min_bet, max_bet, type, reset_budget, join_code')
          .eq('id', profile.league_id)
          .maybeSingle();

        if (leagueError) throw leagueError;
        if (!leagueData) throw new Error('Liga no encontrada');

        setLeagueData(leagueData);
        setLeagueName(leagueData.name);
        setCurrentWeek(leagueData.week);
      } catch (e: any) {
        console.error(e);
        setCurrentWeek(null);
        setLeagueName(null);
        setLeagueData(null);
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
      if (leagueData) {
        setLeagueData({ ...leagueData, week: 1 });
      }
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

  const handleResetBudgets = async () => {
    if (!leagueId) return;
    try {
      setResettingBudgets(true);

      const { error } = await supabase
        .from('profiles')
        .update({ weekly_budget: 1000 })
        .eq('league_id', leagueId);

      if (error) throw error;

      toast({
        title: 'Presupuestos reiniciados',
        description: `Todos los usuarios de la liga ${leagueName} tienen ahora presupuesto 1000.`,
      });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo reiniciar los presupuestos.',
        variant: 'destructive',
      });
    } finally {
      setResettingBudgets(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copiado',
      description: 'Código de unión copiado al portapapeles.',
    });
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground">Herramientas para gestionar cuotas, resultados y presupuestos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Información de la Liga */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información de la Liga</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWeek ? (
              <p className="text-sm text-muted-foreground">Cargando datos de la liga…</p>
            ) : leagueData ? (
              <div className="text-sm" style={{ lineHeight: 1.5 }}>
                <p>
                  <span className="font-semibold">Nombre:</span> {leagueData.name} ({leagueData.type})
                </p>
                <p className="flex items-center justify-start">
                  <span className="font-semibold mr-2">Código de unión:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0"
                    onClick={() => handleCopyCode(leagueData.join_code)}
                  >
                    {leagueData.join_code} <Copy size={16} />
                  </Button>
                </p>
                <p>
                  <span className="font-semibold">Presupuesto:</span> {leagueData.budget} ({leagueData.reset_budget})
                </p>
                <p>
                  <span className="font-semibold">Apuesta mínima:</span> {leagueData.min_bet}
                </p>
                <p>
                  <span className="font-semibold">Apuesta máxima:</span> {leagueData.max_bet}
                </p>
                <p>
                  <span className="font-semibold">Semana de la liga:</span> {leagueData.week}
                </p>
              </div>
            ) : (
              <p className="text-sm text-red-600">No se pudo cargar la información de la liga.</p>
            )}
          </CardContent>
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
      </div>
    </div>
  );
};

export default AdminLiga;