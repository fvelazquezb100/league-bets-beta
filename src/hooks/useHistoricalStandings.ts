import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HistoricalStanding {
  week: number;
  position: number;
  username: string;
  total_points: number;
}

export interface HistoricalStandingsData {
  [username: string]: {
    [week: number]: number; // position for each week
  };
}

export const useHistoricalStandings = (leagueId: number | null) => {
  return useQuery({
    queryKey: ['historical-standings', leagueId],
    queryFn: async (): Promise<HistoricalStandingsData> => {
      if (!leagueId) return {};

      // Obtener todos los perfiles de la liga
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('league_id', leagueId);

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return {};

      // Obtener todas las semanas disponibles en esta liga
      const { data: weeksData, error: weeksError } = await supabase
        .from('bets')
        .select(`
          week,
          profiles!inner(league_id)
        `)
        .eq('profiles.league_id', leagueId)
        .not('week', 'is', null);

      if (weeksError) throw weeksError;

      // Obtener semanas únicas y ordenarlas
      const uniqueWeeks = [...new Set(weeksData?.map(bet => bet.week).filter(Boolean))];
      const sortedWeeks = uniqueWeeks.sort((a, b) => Number(a) - Number(b));

      if (sortedWeeks.length === 0) return {};

      // Construir el objeto de datos históricos
      const historicalData: HistoricalStandingsData = {};
      
      // Inicializar estructura para cada usuario
      profiles.forEach(profile => {
        historicalData[profile.username] = {};
      });

      // Para cada semana, calcular las posiciones acumuladas
      for (const week of sortedWeeks) {
        // Obtener puntos acumulados hasta esta semana para cada jugador
        const cumulativePoints: { [userId: string]: number } = {};
        
        for (const profile of profiles) {
          // Sumar todos los puntos ganados desde la semana 1 hasta la semana actual
          const { data: betsData, error: betsError } = await supabase
            .from('bets')
            .select('payout')
            .eq('user_id', profile.id)
            .eq('status', 'won')
            .lte('week', week);

          if (betsError) {
            console.warn(`Error fetching bets for user ${profile.id} up to week ${week}:`, betsError);
            cumulativePoints[profile.id] = 0;
            continue;
          }

          const totalPoints = betsData?.reduce((sum, bet) => sum + (bet.payout || 0), 0) || 0;
          cumulativePoints[profile.id] = totalPoints;
        }

        // Ordenar por puntos acumulados (descendente) para obtener posiciones
        const sortedByPoints = Object.entries(cumulativePoints)
          .map(([userId, points]) => ({
            userId,
            points,
            username: profiles.find(p => p.id === userId)?.username || 'Unknown'
          }))
          .sort((a, b) => b.points - a.points);

        // Asignar posiciones
        sortedByPoints.forEach((player, index) => {
          const position = index + 1;
          historicalData[player.username][Number(week)] = position;
        });
      }

      return historicalData;
    },
    enabled: !!leagueId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
