import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type ProfileRow = { league_id: number; role: string; };
type LeagueRow = { id: number; name: string; week: number; budget: number; min_bet: number; max_bet: number; type: string; reset_budget: string; join_code: string; };

const AdminLiga: React.FC = () => {
  const { toast } = useToast();

  const [resettingBudgets, setResettingBudgets] = React.useState(false);
  const [currentWeek, setCurrentWeek] = React.useState<number | null>(null);
  const [leagueName, setLeagueName] = React.useState<string | null>(null);
  const [loadingWeek, setLoadingWeek] = React.useState(true);
  const [resettingWeek, setResettingWeek] = React.useState(false);
  const [leagueId, setLeagueId] = React.useState<number | null>(null);
  const [leagueData, setLeagueData] = React.useState<LeagueRow | null>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  const [confirmingReset, setConfirmingReset] = React.useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = React.useState(false);
  const [isUpdatingLeague, setIsUpdatingLeague] = React.useState(false);

  // Form state
  const [editLeagueName, setEditLeagueName] = React.useState('');
  const [editBudget, setEditBudget] = React.useState(1000);
  const [editMinBet, setEditMinBet] = React.useState(1);
  const [editMaxBet, setEditMaxBet] = React.useState(1000);
  const [editResetBudget, setEditResetBudget] = React.useState('weekly');

  React.useEffect(() => {
    const fetchWeek = async () => {
      try {
        setLoadingWeek(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('league_id, role')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;

        setLeagueId(profileData.league_id);
        setUserRole(profileData.role);

        const { data: leagueData, error: leagueError } = await supabase
          .from('leagues')
          .select('id, name, week, budget, min_bet, max_bet, type, reset_budget, join_code')
          .eq('id', profileData.league_id)
          .maybeSingle();
        if (leagueError) throw leagueError;

        setLeagueData(leagueData as LeagueRow);
        if (leagueData) {
          setEditLeagueName(leagueData.name);
          setEditBudget(leagueData.budget);
          setEditMinBet(leagueData.min_bet);
          setEditMaxBet(leagueData.max_bet);
          setEditResetBudget(leagueData.reset_budget);
        }
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoadingWeek(false);
      }
    };
    fetchWeek();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copiado', description: 'Código de unión copiado al portapapeles.' });
  };

  const handleUpdateLeague = async () => {
    if (!leagueId || !leagueData) return;
    try {
      setIsUpdatingLeague(true);
      const updates: Partial<LeagueRow> = {};
      let hasChanges = false;

      if (editLeagueName !== leagueData.name) { updates.name = editLeagueName; hasChanges = true; }
      if (editBudget !== leagueData.budget) { updates.budget = editBudget; hasChanges = true; }
      if (editMinBet !== leagueData.min_bet) { updates.min_bet = editMinBet; hasChanges = true; }
      if (editMaxBet !== leagueData.max_bet) { updates.max_bet = editMaxBet; hasChanges = true; }
      if (editResetBudget !== leagueData.reset_budget) { updates.reset_budget = editResetBudget; hasChanges = true; }

      if (!hasChanges) { toast({ title: 'Sin cambios', description: 'No se detectaron cambios para actualizar.' }); return; }

      const { error } = await supabase.from('leagues').update(updates).eq('id', leagueId);
      if (error) throw error;

      setLeagueData({ ...leagueData, ...updates });
      toast({ title: 'Liga actualizada', description: 'Los cambios se guardaron correctamente.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'No se pudo actualizar la liga.', variant: 'destructive' });
    } finally { setIsUpdatingLeague(false); }
  };

  const handleResetWeek = async () => {
    if (!leagueId) return;
    try {
      setResettingWeek(true);
      await supabase.from('leagues').update({ week: 1 }).eq('id', leagueId);
      await supabase.from('profiles').update({ total_points: 0 }).eq('league_id', leagueId);
      toast({ title: 'Liga reseteada', description: 'La semana y los puntos fueron reiniciados.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'No se pudo resetear la liga.', variant: 'destructive' });
    } finally { setResettingWeek(false); setConfirmingReset(false); }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Panel de Administración de tu Liga</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Información de la Liga</CardTitle></CardHeader>
          <CardContent>
            {loadingWeek ? <p>Cargando datos de la liga…</p> : leagueData ? (
              <div>
                <div className="text-sm space-y-1">
                  <p><span className="font-semibold mr-2">Nombre:</span>{leagueData.name} ({leagueData.type})</p>
                  <p className="flex items-center gap-2"><span className="font-semibold">Código:</span><Button variant="ghost" size="sm" onClick={() => handleCopyCode(leagueData.join_code)}>{leagueData.join_code} <Copy size={16} /></Button></p>
                  <p><span className="font-semibold mr-2">Presupuesto:</span>{leagueData.budget} ({leagueData.reset_budget})</p>
                  <p><span className="font-semibold mr-2">Apuesta mínima:</span>{leagueData.min_bet}</p>
                  <p><span className="font-semibold mr-2">Apuesta máxima:</span>{leagueData.max_bet}</p>
                  <p><span className="font-semibold mr-2">Semana:</span>{leagueData.week}</p>
                </div>

                {userRole === 'admin_league' && (
                  <div className="mt-4">
                    <Collapsible open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                          Edit League Values {isEditFormOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 p-4 border rounded-lg bg-muted/50 space-y-4">
                        <div className="space-y-2"><Label>League Name</Label><Input value={editLeagueName} onChange={e => setEditLeagueName(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Weekly Budget</Label><Input type="number" min={500} max={10000} value={editBudget} onChange={e => setEditBudget(Number(e.target.value))} /></div>
                        <div className="space-y-2"><Label>Min Bet</Label><Input type="number" min={1} max={editBudget} value={editMinBet} onChange={e => setEditMinBet(Number(e.target.value))} /></div>
                        <div className="space-y-2"><Label>Max Bet</Label><Input type="number" min={editMinBet} max={editBudget} value={editMaxBet} onChange={e => setEditMaxBet(Number(e.target.value))} /></div>
                        <div className="space-y-2"><Label>Budget Reset Frequency</Label>
                          <select value={editResetBudget} onChange={e => setEditResetBudget(e.target.value)}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>
                        <div className="flex justify-end"><Button onClick={handleUpdateLeague} disabled={isUpdatingLeague}>{isUpdatingLeague ? 'Actualizando...' : 'Actualizar'}</Button></div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
              </div>
            ) : <p className="text-red-600">No se pudo cargar la información de la liga.</p>}
          </CardContent>
        </Card>

        {userRole === 'admin_league' && (
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Reseteo de la Liga</CardTitle></CardHeader>
            <CardContent><p>Esta opción reseteará tu Liga. Todos los puntos serán 0</p></CardContent>
            <CardFooter><Button onClick={() => setConfirmingReset(true)} disabled={resettingWeek}>{resettingWeek ? 'Reseteando…' : 'Resetear la Liga'}</Button></CardFooter>
          </Card>
        )}
      </div>

      {confirmingReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center space-y-4">
            <p className="text-lg font-semibold">¿Estás seguro que quieres resetear la liga?</p>
            <div className="flex justify-between gap-4">
              <Button variant="destructive" onClick={handleResetWeek}>Sí, resetear</Button>
              <Button onClick={() => setConfirmingReset(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLiga;