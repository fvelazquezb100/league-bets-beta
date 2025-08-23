import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type ProfileRow = {
  league_id: number;
};

type LeagueRow = {
  id: number;
  name: string;
  week: number;
};

const AdminLiga: React.FC = () => {
  const { toast } = useToast();

  const [resettingBudgets, setResettingBudgets] = React.useState(false);

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

  const handleResetBudgets = async () => {
    try {
      setResettingBudgets(true);

      // Obtener token del usuario actual
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("No se pudo obtener el token del usuario");

      // Invocar la Edge Function con Authorization header
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-reset-budgets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al resetear presupuestos");

      toast({
        title: 'Presupuestos reiniciados',
        description: 'Todos los presupuestos semanales fueron reiniciados a 1000.',
      });
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
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