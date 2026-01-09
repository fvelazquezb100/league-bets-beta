import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Settings, Crown, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal';
import { PremiumFeaturesModal } from '@/components/PremiumFeaturesModal';
import { useUsersDonationStatus, useUsersProStatus } from '@/hooks/useUserDonations';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  boost_max_stake?: number;
  boost_multiplier?: number;
};

type AvailableLeague = {
  id: number;
  name: string;
  flag: string;
};

const AdminLiga: React.FC = () => {
  const { toast } = useToast();
  const { consent } = useCookieConsent();

  React.useEffect(() => {
    const pageTitle = 'Jambol — Tu Liga';
    const description = 'Panel de administración de tu liga Jambol. Gestiona la configuración, miembros, disponibilidad de partidos y configuración avanzada.';
    const keywords = 'jambol, tu liga, administración, configuración, gestión, liga privada, panel admin';

    document.title = pageTitle;

    const metaDefinitions = [
      {
        selector: 'meta[name="description"]',
        attributes: { name: 'description' },
        content: description,
      },
      {
        selector: 'meta[name="keywords"]',
        attributes: { name: 'keywords' },
        content: keywords,
      },
      {
        selector: 'meta[property="og:title"]',
        attributes: { property: 'og:title' },
        content: pageTitle,
      },
      {
        selector: 'meta[property="og:description"]',
        attributes: { property: 'og:description' },
        content: description,
      },
      {
        selector: 'meta[name="twitter:title"]',
        attributes: { name: 'twitter:title' },
        content: pageTitle,
      },
      {
        selector: 'meta[name="twitter:description"]',
        attributes: { name: 'twitter:description' },
        content: description,
      },
    ];

    const managedMeta = metaDefinitions.map(({ selector, attributes, content }) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      let created = false;

      if (!element) {
        element = document.createElement('meta');
        Object.entries(attributes).forEach(([attribute, value]) => {
          element?.setAttribute(attribute, value);
        });
        document.head.appendChild(element);
        created = true;
      }

      const previousContent = element.getAttribute('content') ?? undefined;
      element.setAttribute('content', content);

      return { element, previousContent, created };
    });

    return () => {
      managedMeta.forEach(({ element, previousContent, created }) => {
        if (created && element.parentNode) {
          element.parentNode.removeChild(element);
        } else if (!created && typeof previousContent === 'string') {
          element.setAttribute('content', previousContent);
        }
      });
    };
  }, []);

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

  const [resettingBudgets, setResettingBudgets] = React.useState(false);
  const [currentWeek, setCurrentWeek] = React.useState<number | null>(null);
  const [leagueName, setLeagueName] = React.useState<string | null>(null);
  const [loadingWeek, setLoadingWeek] = React.useState(true);
  const [resettingWeek, setResettingWeek] = React.useState(false);
  const [resettingWeekManually, setResettingWeekManually] = React.useState(false);
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
  const [editBoostMaxStake, setEditBoostMaxStake] = React.useState(200);
  const [editBoostMultiplier, setEditBoostMultiplier] = React.useState(1.25);
  const budgetRef = useRef<HTMLInputElement>(null);

  // Available leagues state
  const [availableLeagues, setAvailableLeagues] = React.useState<AvailableLeague[]>([]);
  const [selectedLeagues, setSelectedLeagues] = React.useState<number[]>([]);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = React.useState(false);
  const [isPremiumFeaturesModalOpen, setIsPremiumFeaturesModalOpen] = React.useState(false);
  const [leagueMembers, setLeagueMembers] = React.useState<Array<{ id: string; username: string; role: string }>>([]);
  const [loadingMembers, setLoadingMembers] = React.useState(false);
  const [assigningRole, setAssigningRole] = React.useState<string | null>(null);

  // Get donation and PRO status for all league members
  const memberIds = leagueMembers.map(m => m.id);
  const { data: donationStatusMap } = useUsersDonationStatus(memberIds);
  const { data: proStatusMap } = useUsersProStatus(memberIds);

  // Define available leagues
  const allLeagues: AvailableLeague[] = [
    { id: 140, name: 'La Liga', flag: '' },
    { id: 2, name: 'Champions League', flag: '' },
    { id: 3, name: 'Europa League', flag: '' },
    { id: 262, name: 'Liga MX', flag: '' },
    { id: 557, name: 'Selecciones', flag: '' },
    { id: 143, name: 'Copa del Rey España', flag: '' },
    { id: 556, name: 'Super Copa España', flag: '' }
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
          .select('id, name, week, budget, min_bet, max_bet, type, league_season, reset_budget, join_code, available_leagues, boost_max_stake, boost_multiplier')
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
              setEditBoostMaxStake((fallbackData as any).boost_max_stake ?? 200);
              setEditBoostMultiplier((fallbackData as any).boost_multiplier ?? 1.25);

              // Use default available leagues when column doesn't exist
              setSelectedLeagues([140, 2, 3, 262, 557, 143, 556]);
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
            setEditBoostMaxStake(league.boost_max_stake ?? 200);
            setEditBoostMultiplier(league.boost_multiplier ?? 1.25);

            // Initialize selected leagues
            setSelectedLeagues((league as any).available_leagues || [140, 2, 3, 262, 557, 143, 556]);
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

  // Fetch league members when leagueId changes
  React.useEffect(() => {
    const fetchLeagueMembers = async () => {
      if (!leagueId) {
        setLeagueMembers([]);
        return;
      }

      try {
        setLoadingMembers(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, role')
          .eq('league_id', leagueId)
          .order('username', { ascending: true });

        if (error) throw error;
        setLeagueMembers(data || []);
      } catch (error: any) {
        console.error('Error fetching league members:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los miembros de la liga',
          variant: 'destructive'
        });
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchLeagueMembers();
  }, [leagueId]);

  // Function to assign admin role to a user
  const handleAssignAdminRole = async (targetUserId: string) => {
    if (!targetUserId) return;

    try {
      setAssigningRole(targetUserId);
      const { data, error } = await supabase.functions.invoke('assign-league-admin-role', {
        body: { target_user_id: targetUserId },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Éxito',
          description: `Rol de administrador asignado a ${data.target_username || 'el usuario'}`,
        });
        // Refresh members list
        const { data: membersData, error: membersError } = await supabase
          .from('profiles')
          .select('id, username, role')
          .eq('league_id', leagueId)
          .order('username', { ascending: true });

        if (!membersError && membersData) {
          setLeagueMembers(membersData);
        }
      } else {
        throw new Error(data.error || 'No se pudo asignar el rol');
      }
    } catch (error: any) {
      console.error('Error assigning admin role:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo asignar el rol de administrador',
        variant: 'destructive'
      });
    } finally {
      setAssigningRole(null);
    }
  };

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
      if (leagueData.type === 'premium') {
        const currentBoostMaxStake = leagueData.boost_max_stake ?? 200;
        const currentBoostMultiplier = leagueData.boost_multiplier ?? 1.25;
        if (editBoostMaxStake !== currentBoostMaxStake) { updates.boost_max_stake = editBoostMaxStake; hasChanges = true; }
        if (editBoostMultiplier !== currentBoostMultiplier) { updates.boost_multiplier = editBoostMultiplier; hasChanges = true; }
      }

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

  const handleResetWeekManually = async () => {
    if (!leagueId) return;

    try {
      setResettingWeekManually(true);

      // 0. Generar noticia de bloqueos para esta liga ANTES de resetear
      console.log('Generando noticias de bloqueo para liga:', leagueId);
      const { error: newsError } = await supabase.rpc('generate_block_news_for_league', {
        target_league_id: leagueId
      });

      if (newsError) {
        console.error('Error generando noticias de bloqueo:', newsError);
        toast({
          title: 'Advertencia',
          description: 'No se pudieron generar las noticias de bloqueos, pero se continuará con el reset.',
          variant: 'destructive',
        });
      }

      // Ejecutar reset manual de semana específico para esta liga
      const { data, error } = await supabase.functions.invoke('admin-reset-budgets', {
        body: {
          manual_week_reset: true,
          force: true,
          league_id: leagueId  // Solo resetear esta liga específica
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Reset de Semana Completado',
        description: 'Semana incrementada, puntos guardados y presupuestos reseteados para tu liga',
      });

      // Refrescar datos de la liga
      const { data: updatedLeague, error: leagueError } = await supabase
        .from('leagues')
        .select('week')
        .eq('id', leagueId)
        .single();

      if (!leagueError && updatedLeague) {
        setLeagueData(prev => prev ? { ...prev, week: updatedLeague.week } : null);
      }
    } catch (error: any) {
      toast({
        title: 'Error en Reset de Semana',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setResettingWeekManually(false);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Panel de Administración de tu Liga</h1>
      </header>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mt-8">
        {/* Información de la Liga */}
        <Card>
          <CardHeader><CardTitle>Información de la Liga</CardTitle></CardHeader>
          <CardContent>
            {loadingWeek ? <p>Cargando datos de la liga…</p> : leagueData ? (
              <div>
                <div className="text-sm space-y-1">
                  <p><span className="font-semibold mr-2">Nombre:</span>{leagueData.name} ({leagueData.type})</p>
                  <p className="flex items-center gap-2"><span className="font-semibold">Código:</span><Button className="jambol-button" size="sm" onClick={() => handleCopyCode(leagueData.join_code)}>{leagueData.join_code} <Copy size={16} /></Button></p>
                  <p><span className="font-semibold mr-2">Presupuesto:</span>{leagueData.budget} ({leagueData.reset_budget})</p>
                  <p><span className="font-semibold mr-2">Puntos invertidos minimos:</span>{leagueData.min_bet}</p>
                  <p><span className="font-semibold mr-2">Puntos invertidos máximos:</span>{leagueData.max_bet}</p>
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
                      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
                        <DialogHeader className="flex-shrink-0">
                          <DialogTitle>Editar Configuración de la Liga</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-0">
                          {leagueData?.type === 'free' ? (
                            <div className="space-y-4">
                              <div className="text-center py-2">
                                <p className="text-muted-foreground mb-2">
                                  <strong>⚠️ Configuración Premium</strong>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Actualiza a premium para poder editar todos estos datos:
                                </p>
                              </div>

                              {/* Mostrar configuración actual (solo lectura) */}
                              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <h4 className="font-semibold text-sm text-gray-700">Configuración actual (solo lectura):</h4>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-600">Nombre:</span>
                                    <p className="text-gray-800">{leagueData?.name}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Presupuesto:</span>
                                    <p className="text-gray-800">{leagueData?.budget}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Puntos invertidos mínimos:</span>
                                    <p className="text-gray-800">{leagueData?.min_bet}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Puntos invertidos máximos:</span>
                                    <p className="text-gray-800">{leagueData?.max_bet}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="font-medium text-gray-600">Reseteo:</span>
                                    <p className="text-gray-800 capitalize">{leagueData?.reset_budget}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Límite SuperBoleto:</span>
                                    <p className="text-gray-800">{leagueData?.boost_max_stake ?? 200} pts</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Multiplicador SuperBoleto:</span>
                                    <p className="text-gray-800">{leagueData?.boost_multiplier ?? 1.25}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
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
                                <Label>Puntos invertidos mínimos: {editMinBet}</Label>
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
                                <Label>Puntos invertidos máximos: {editMaxBet}</Label>
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

                              {/* Boost Settings - Only for premium leagues */}
                              <div className="border-t pt-4 space-y-4">
                                <h4 className="font-semibold text-sm">Configuración de SuperBoleto</h4>
                                
                                <div className="space-y-2">
                                  <Label>Límite máximo para SuperBoleto: {editBoostMaxStake} pts</Label>
                                  <input
                                    type="range"
                                    min={editMinBet}
                                    max={editMaxBet}
                                    step={10}
                                    value={editBoostMaxStake}
                                    onChange={e => setEditBoostMaxStake(Number(e.target.value))}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Rango permitido: {editMinBet} - {editMaxBet} pts
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="boost-multiplier">Multiplicador de SuperBoleto</Label>
                                  <select
                                    id="boost-multiplier"
                                    value={editBoostMultiplier}
                                    onChange={e => setEditBoostMultiplier(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                  >
                                    <option value={1.25}>1.25</option>
                                    <option value={1.5}>1.5</option>
                                    <option value={2.0}>2.0</option>
                                  </select>
                                </div>
                              </div>
                            </>
                          )}

                          <div className="space-y-2">
                            <Label>Ligas disponibles para participar</Label>
                            {leagueData?.type === 'free' ? (
                              <>
                                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                                  {allLeagues.map((league) => (
                                    <div key={league.id} className="flex items-center justify-between">
                                      <span className="text-sm font-medium">{league.name}</span>
                                      <input
                                        type="checkbox"
                                        checked={selectedLeagues.includes(league.id)}
                                        onChange={() => handleLeagueToggle(league.id)}
                                        className="w-4 h-4 text-[#FFC72C] border-gray-300 rounded focus:ring-[#FFC72C] accent-[#FFC72C]"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {selectedLeagues.length} liga{selectedLeagues.length !== 1 ? 's' : ''} seleccionada{selectedLeagues.length !== 1 ? 's' : ''}
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                                  {allLeagues.map((league) => (
                                    <div key={league.id} className="flex items-center justify-between">
                                      <span className="text-sm font-medium">{league.name}</span>
                                      <input
                                        type="checkbox"
                                        checked={selectedLeagues.includes(league.id)}
                                        onChange={() => handleLeagueToggle(league.id)}
                                        className="w-4 h-4 text-[#FFC72C] border-gray-300 rounded focus:ring-[#FFC72C] accent-[#FFC72C]"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {selectedLeagues.length} liga{selectedLeagues.length !== 1 ? 's' : ''} seleccionada{selectedLeagues.length !== 1 ? 's' : ''}
                                </p>
                              </>
                            )}
                          </div>

                          <div className="flex justify-end gap-2 pt-4 flex-shrink-0 border-t mt-4">
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

        {/* Liga Premium */}
        {leagueData && leagueId && (
          <Card 
            className={`border-2 border-yellow-400 bg-gradient-to-br from-yellow-50/50 to-amber-50/50 shadow-lg ${
              leagueData?.type === 'premium' ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''
            }`}
            onClick={() => {
              if (leagueData?.type === 'premium') {
                setIsPremiumFeaturesModalOpen(true);
              }
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                Liga Premium
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leagueData?.type === 'premium' ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-3">
                      <Crown className="h-8 w-8 text-yellow-600" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Tu liga es Premium
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Disfruta de todas las funcionalidades avanzadas
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Premium hasta final de temporada 2025-2026 (31/05/2026)
                    </p>
                    <p className="text-xs text-yellow-600 mt-2 font-medium">
                      Haz clic para ver todas las funcionalidades
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Actualiza a premium para desbloquear funcionalidades avanzadas como bloqueo de partidos, control de disponibilidad y más.
                    </p>
                    <Button
                      className="w-full jambol-button bg-[#FFC72C] text-black hover:bg-[#FFD54F]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPremiumModalOpen(true);
                      }}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Actualizar a Premium
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reseteo Manual de Semana */}
        {leagueData && leagueId && (
            <Card>
              <CardHeader>
              <CardTitle>Reseteo Manual de Semana</CardTitle>
              <p className="text-sm text-muted-foreground">
                Resetea manualmente la jornada y no esperes al martes.
              </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {leagueData?.type === 'free' ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">
                      <strong>⚠️ Funcionalidad Premium</strong>
                    </p>
                  <p className="text-sm text-muted-foreground mb-4">
                      Actualiza a premium para poder tener esta funcionalidad
                    </p>
                  <Button
                    onClick={() => setIsPremiumModalOpen(true)}
                    className="w-full jambol-button bg-[#FFC72C] text-black hover:bg-[#FFD54F]"
                  >
                    Actualizar a Premium
                  </Button>
                  </div>
                ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    <strong>⚠️ ATENCIÓN:</strong> Ejecuta el reset de semana para tu liga: guarda puntos actuales, incrementa semana +1 y resetea presupuestos.
                  </p>
                  {userRole !== 'admin_league' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Settings className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-yellow-800">
                          <p>Solo los administradores de la liga pueden ejecutar el reseteo manual de semana.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
                )}
              </CardContent>
            {leagueData?.type === 'premium' && userRole === 'admin_league' && (
              <CardFooter>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={resettingWeekManually}
                      className="jambol-button w-full"
                      >
                      {resettingWeekManually ? 'Reseteando...' : 'Reseteo Manual de Semana'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción ejecutará el reset de semana para tu liga:
                          <br />• Generará automáticamente una noticia con los bloqueos de la semana
                          <br />• Guardará los puntos de la semana actual
                          <br />• Incrementará la semana de tu liga
                          <br />• Reseteará los presupuestos de los usuarios de tu liga
                          <br />
                          <br />
                          <strong>Esta acción no se puede deshacer.</strong>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleResetWeekManually}
                          className="jambol-button"
                        >
                          Sí, resetear semana
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </CardFooter>
            )}
            </Card>
        )}

        {/* Control de Disponibilidad de Partidos */}
        {leagueData && leagueId && (
          <Card>
            <CardHeader>
              <CardTitle>
                Control de Dias de Partidos
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Gestiona qué días están disponibles los partidos en vivo en {leagueData.name}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {leagueData?.type === 'free' ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">
                    <strong>⚠️ Funcionalidad Premium</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Actualiza a premium para poder tener esta funcionalidad
                  </p>
                  <Button
                    onClick={() => setIsPremiumModalOpen(true)}
                    className="w-full jambol-button bg-[#FFC72C] text-black hover:bg-[#FFD54F]"
                  >
                    Actualizar a Premium
                  </Button>
                </div>
              ) : (
                <Link to="/league-match-availability">
                  <Button className="jambol-button w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    {userRole === 'admin_league' 
                      ? 'Configurar Disponibilidad de Partidos'
                      : 'Ver Disponibilidad de Partidos'}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Miembros de la Liga - Solo para ligas premium */}
        {userRole === 'admin_league' && leagueData?.type === 'premium' && (
          <Card>
            <CardHeader>
              <CardTitle>
                Miembros de la Liga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Como administrador de una liga premium, puedes asignar el rol de administrador a otros miembros de tu liga.
              </p>
              {loadingMembers ? (
                <p className="text-sm text-muted-foreground">Cargando miembros...</p>
              ) : leagueMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay miembros en la liga</p>
              ) : (
                <div className="space-y-3">
                  {leagueMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{member.username}</span>
                        {proStatusMap?.get(member.id) && (
                          <span className="text-xs font-semibold text-purple-600">PRO</span>
                        )}
                        {donationStatusMap?.get(member.id) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-yellow-500 flex-shrink-0 cursor-help">⭐</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ha apoyado el proyecto</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {member.role === 'admin_league' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Shield className="h-4 w-4 text-yellow-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Administrador</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {member.role !== 'admin_league' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="jambol-button hover:bg-[#FFC72C] hover:text-black"
                          onClick={() => handleAssignAdminRole(member.id)}
                          disabled={assigningRole === member.id}
                        >
                          {assigningRole === member.id ? 'Asignando...' : 'Hacer Admin'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
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

      <PremiumUpgradeModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onSuccess={() => {
          // Reload page to refresh league data
          window.location.reload();
        }}
      />
      <PremiumFeaturesModal
        isOpen={isPremiumFeaturesModalOpen}
        onClose={() => setIsPremiumFeaturesModalOpen(false)}
      />
    </div>
  );
};

export default AdminLiga;