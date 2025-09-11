import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type ProfileRow = { league_id: number; role: string; };
type LeagueRow = { 
  id: number; 
  name: string; 
  week: number; 
  budget: number; 
  min_bet: number; 
  max_bet: number; 
  type: 'free' | 'premium'; 
  reset_budget: string; 
  join_code: string; 
  league_season: number;
  available_leagues: number[];
};

type AvailableLeague = {
  id: number;
  name: string;
  flag: string;
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
  const budgetRef = useRef<HTMLInputElement>(null);

  // Available leagues state
  const [availableLeagues, setAvailableLeagues] = React.useState<AvailableLeague[]>([]);
  const [selectedLeagues, setSelectedLeagues] = React.useState<number[]>([]);

  // Define available leagues
  const allLeagues: AvailableLeague[] = [
    { id: 140, name: 'La Liga', flag: '' },
    { id: 2, name: 'Champions League', flag: '' },
    { id: 3, name: 'Europa League', flag: '' },
    { id: 262, name: 'Liga MX', flag: '' }
  ];

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
          .select('id, name, week, budget, min_bet, max_bet, type, league_season, reset_budget, join_code, available_leagues')
          .eq('id', profileData.league_id)
          .maybeSingle();
        
        if (leagueError) {
          // If available_leagues column doesn't exist, try without it
          if (leagueError.message.includes('available_leagues')) {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('leagues')
              .select('id, name, week, budget, min_bet, max_bet, type, league_season, reset_budget, join_code')
              .eq('id', profileData.league_id)
              .maybeSingle();
            
            if (fallbackError) throw fallbackError;
            
            setLeagueData(fallbackData as LeagueRow);
            if (fallbackData) {
              setEditLeagueName(fallbackData.name);
              setEditBudget(fallbackData.budget);
              setEditMinBet(fallbackData.min_bet);
              setEditMaxBet(fallbackData.max_bet);
              setEditResetBudget(fallbackData.reset_budget);
              
              // Use default available leagues when column doesn't exist
              setSelectedLeagues([140, 2, 3, 262]);
            }
          } else {
            throw leagueError;
          }
        } else {
          setLeagueData(leagueData as unknown as LeagueRow);
          if (leagueData) {
            const league = leagueData as unknown as LeagueRow;
            setEditLeagueName(league.name);
            setEditBudget(league.budget);
            setEditMinBet(league.min_bet);
            setEditMaxBet(league.max_bet);
            setEditResetBudget(league.reset_budget);
            
            // Initialize selected leagues
            setSelectedLeagues((league as any).available_leagues || [140, 2, 3, 262]);
          }
        }
        
        // Set available leagues
        setAvailableLeagues(allLeagues);
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
      const updates: any = {};
      let hasChanges = false;

      if (editLeagueName !== leagueData.name) { updates.name = editLeagueName; hasChanges = true; }
      if (editBudget !== leagueData.budget) { updates.budget = editBudget; hasChanges = true; }
      if (editMinBet !== leagueData.min_bet) { updates.min_bet = editMinBet; hasChanges = true; }
      if (editMaxBet !== leagueData.max_bet) { updates.max_bet = editMaxBet; hasChanges = true; }
      if (editResetBudget !== leagueData.reset_budget) { updates.reset_budget = editResetBudget; hasChanges = true; }
      
      // Check if available leagues changed
      const currentLeagues = (leagueData as any).available_leagues || [];
      const leaguesChanged = JSON.stringify(currentLeagues.sort()) !== JSON.stringify(selectedLeagues.sort());
      if (leaguesChanged) { 
        updates.available_leagues = selectedLeagues; 
        hasChanges = true; 
      }

      if (!hasChanges) { toast({ title: 'Sin cambios', description: 'No se detectaron cambios para actualizar.' }); return; }

      const { error } = await supabase.from('leagues').update(updates).eq('id', leagueId);
      if (error) throw error;

      setLeagueData({ ...leagueData, ...updates });
      setIsEditFormOpen(false);
      toast({ title: 'Liga actualizada', description: 'Los cambios se guardaron correctamente.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'No se pudo actualizar la liga.', variant: 'destructive' });
    } finally { setIsUpdatingLeague(false); }
  };

  const handleLeagueToggle = (leagueId: number) => {
    setSelectedLeagues(prev => 
      prev.includes(leagueId) 
        ? prev.filter(id => id !== leagueId)
        : [...prev, leagueId]
    );
  };


const handleResetWeek = async () => {
  if (!leagueId) return;

  try {
    setResettingWeek(true);

    // 1️⃣ Obtener el usuario con más y menos puntos en esta liga
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, total_points')
      .eq('league_id', leagueId)
      .order('total_points', { ascending: false });

    if (usersError) throw usersError;
    if (!users || users.length === 0) throw new Error('No hay usuarios en la liga.');

    const championId = users[0].id; // más puntos
    const lastId = users[users.length - 1].id; // menos puntos

    // 2️⃣ Obtener la temporada actual
    const { data: league, error: leagueFetchError } = await supabase
      .from('leagues')
      .select('league_season')
      .eq('id', leagueId)
      .single();

    if (leagueFetchError) throw leagueFetchError;
    const currentSeason = league?.league_season ?? 1;

    // 3️⃣ Actualizar la liga: semana, temporada, previous_champion y previous_last
    const { error: leagueError } = await supabase
      .from('leagues')
      .update({
        week: 1,
        league_season: currentSeason + 1,
        previous_champion: championId,
        previous_last: lastId,
      })
      .eq('id', leagueId);

    if (leagueError) throw leagueError;

    // 4️⃣ Resetear puntos de todos los usuarios de la liga
    const { error: profilesError } = await supabase
      .from('profiles')
      .update({ total_points: 0 })
      .eq('league_id', leagueId);

    if (profilesError) throw profilesError;

    toast({
      title: 'Liga reseteada',
      description: 'Semana, temporada y puntos reiniciados. Campeón y último actualizados.',
    });
  } catch (e: any) {
    toast({
      title: 'Error',
      description: e?.message ?? 'No se pudo resetear la liga.',
      variant: 'destructive',
    });
  } finally {
    setResettingWeek(false);
    setConfirmingReset(false);
  }
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
                  <p className="flex items-center gap-2"><span className="font-semibold">Código:</span><Button className="jambol-button" size="sm" onClick={() => handleCopyCode(leagueData.join_code)}>{leagueData.join_code} <Copy size={16} /></Button></p>
                  <p><span className="font-semibold mr-2">Presupuesto:</span>{leagueData.budget} ({leagueData.reset_budget})</p>
                  <p><span className="font-semibold mr-2">Apuesta mínima:</span>{leagueData.min_bet}</p>
                  <p><span className="font-semibold mr-2">Apuesta máxima:</span>{leagueData.max_bet}</p>
                  <p><span className="font-semibold mr-2">Semana:</span>{leagueData.week}</p>
                  <p><span className="font-semibold mr-2">Temporada:</span>{leagueData.league_season}</p>
                  <p><span className="font-semibold mr-2">Ligas disponibles:</span>
                    {(leagueData as any).available_leagues?.map((id: number) => {
                      const league = allLeagues.find(l => l.id === id);
                      return league ? league.name : '';
                    }).filter(Boolean).join(', ') || 'No configuradas'}
                  </p>
                </div>

                {userRole === 'admin_league' && (
                  <div className="mt-4">
                    <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
                      <DialogTrigger asChild>
                        <Button className="jambol-button flex items-center gap-2" size="sm">
                          <Settings size={16} />
                          Editar Liga
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Editar Configuración de la Liga</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="league-name">Nombre de la Liga</Label>
                            <Input 
                              id="league-name"
                              value={editLeagueName} 
                              onChange={e => setEditLeagueName(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Presupuesto: {editBudget}</Label>
                            <input
                              ref={budgetRef}
                              type="range"
                              min={500}
                              max={10000}
                              step={50}
                              value={editBudget}
                              onChange={e => setEditBudget(Number(e.target.value))}
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                              autoFocus
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Apuesta Mínima: {editMinBet}</Label>
                            <input
                              type="range"
                              min={1}
                              max={editMaxBet}
                              step={1}
                              value={editMinBet}
                              onChange={e => setEditMinBet(Number(e.target.value))}
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-success"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Apuesta Máxima: {editMaxBet}</Label>
                            <input
                              type="range"
                              min={editMinBet}
                              max={editBudget}
                              step={1}
                              value={editMaxBet}
                              onChange={e => setEditMaxBet(Number(e.target.value))}
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="reset-budget">Frecuencia de reseteo de presupuesto</Label>
                            <select 
                              id="reset-budget"
                              value={editResetBudget} 
                              onChange={e => setEditResetBudget(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            >
                              <option value="daily">Diario</option>
                              <option value="weekly">Semanal</option>
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Ligas disponibles para apostar</Label>
                            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                              {allLeagues.map((league) => (
                                <div key={league.id} className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{league.name}</span>
                                  <input
                                    type="checkbox"
                                    checked={selectedLeagues.includes(league.id)}
                                    onChange={() => handleLeagueToggle(league.id)}
                                    //aqui habia un conflicto
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                  />
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">
                              {selectedLeagues.length} liga{selectedLeagues.length !== 1 ? 's' : ''} seleccionada{selectedLeagues.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          
                          <div className="flex justify-end gap-2 pt-4">
                            <Button 
                              className="jambol-button"
                              onClick={() => setIsEditFormOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              className="jambol-button"
                              onClick={handleUpdateLeague} 
                              disabled={isUpdatingLeague}
                            >
                              {isUpdatingLeague ? 'Actualizando...' : 'Actualizar'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
            <CardFooter><Button className="jambol-button" onClick={() => setConfirmingReset(true)} disabled={resettingWeek}>{resettingWeek ? 'Reseteando…' : 'Resetear la Liga'}</Button></CardFooter>
          </Card>
        )}
      </div>

      {confirmingReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center space-y-4">
            <p className="text-lg font-semibold">¿Estás seguro que quieres resetear la liga?</p>
            <div className="flex justify-between gap-4">
              <Button variant="destructive" onClick={handleResetWeek}>Sí, resetear</Button>
              <Button className="jambol-button" onClick={() => setConfirmingReset(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLiga;