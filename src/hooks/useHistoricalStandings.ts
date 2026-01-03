import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';

export interface HistoricalStanding {
  week: number;
  position: number;
  username: string;
  total_points: number;
}

export interface HistoricalStandingsData {
  [username: string]: {
    [week: number]: {
      position: number;
      points: number;
    };
  };
}

export interface HistoricalStandingsProgress {
  totalPlayers: number;
  loadedPlayers: number;
  currentPlayer?: string;
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

      // Obtener la semana actual de la liga
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('week')
        .eq('id', leagueId)
        .single();

      if (leagueError) throw leagueError;
      if (!leagueData?.week) return {};

      // Generar todas las semanas desde 1 hasta la semana actual - 1
      const currentWeek = leagueData.week;
      const sortedWeeks = Array.from({ length: currentWeek - 1 }, (_, i) => i + 1);

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
          // Obtener todas las apuestas del usuario y filtrar por semana
          // Note: Supabase has a default limit of 1000 rows, so we need to use range() to get all rows
          const { data: allBets, error: betsError } = await supabase
            .from('bets')
            .select('payout, week')
            .eq('user_id', profile.id)
            .eq('status', 'won')
            .range(0, 999999); // Remove default 1000 limit

          if (betsError) {
            console.warn(`Error fetching bets for user ${profile.id}:`, betsError);
            cumulativePoints[profile.id] = 0;
            continue;
          }

          // Filtrar manualmente por semana (comparación numérica)
          const betsData = allBets?.filter(bet => Number(bet.week) <= Number(week)) || [];

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

        // Asignar posiciones basadas en puntos acumulados
        sortedByPoints.forEach((player, index) => {
          const position = index + 1;
          historicalData[player.username][Number(week)] = {
            position: position,
            points: player.points
          };
        });
      }


      return historicalData;
    },
    enabled: !!leagueId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useHistoricalStandingsProgress = (leagueId: number | null) => {
  const [progress, setProgress] = React.useState<HistoricalStandingsProgress>({ totalPlayers: 0, loadedPlayers: 0 });
  
  React.useEffect(() => {
    if (!leagueId) return;

    // Obtener el número total de jugadores
    const fetchProfiles = async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('league_id', leagueId);

      if (profilesError || !profiles || profiles.length === 0) return;

      const totalPlayers = profiles.length;
      const target80Percent = Math.floor(totalPlayers * 0.8);
      
      // Inicializar con 0
      setProgress({ totalPlayers, loadedPlayers: 0, currentPlayer: profiles[0]?.username });
      
      // Simular carga progresiva durante 7 segundos hasta el 80%
      const startTime = Date.now();
      const duration = 7000; // 7 segundos
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(elapsed / duration, 0.8); // Máximo 80%
        const loadedPlayers = Math.floor(progressRatio * totalPlayers);
        
        setProgress({
          totalPlayers,
          loadedPlayers,
          currentPlayer: profiles[loadedPlayers]?.username
        });
        
        if (progressRatio < 0.8) {
          setTimeout(updateProgress, 50); // Actualizar cada 50ms para más suavidad
        }
      };
      
      // Empezar la animación después de un pequeño delay
      setTimeout(updateProgress, 100);
    };

    fetchProfiles();
  }, [leagueId]);

  return { data: progress };
};
