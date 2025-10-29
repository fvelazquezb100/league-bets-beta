import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { HistoricalStandingsData } from '@/hooks/useHistoricalStandings';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface HistoricalStandingsChartProps {
  data: HistoricalStandingsData;
  isLoading?: boolean;
  leagueId?: number | null;
}

export const HistoricalStandingsChart: React.FC<HistoricalStandingsChartProps> = ({
  data,
  isLoading = false,
  leagueId,
}) => {
  const [isLeftToRight, setIsLeftToRight] = React.useState(true);
  const isMobile = useIsMobile();


  // Convertir los datos al formato que necesita Recharts (semanas invertidas)
  const chartData = React.useMemo(() => {
    const usernames = Object.keys(data);
    if (usernames.length === 0) return [];

    // Obtener todas las semanas disponibles de los datos
    const allWeeks = new Set<number>();
    usernames.forEach(username => {
      Object.keys(data[username]).forEach(week => {
        allWeeks.add(parseInt(week));
      });
    });

    // Ordenar semanas de mayor a menor (semana 5 a la izquierda)
    const weeks = Array.from(allWeeks).sort((a, b) => b - a);
    
    // En móvil, limitar a las últimas 8 jornadas
    const limitedWeeks = isMobile ? weeks.slice(0, 8) : weeks;

    // Crear datos para cada semana
    return limitedWeeks.map(week => {
      const weekData: any = { week };
      
      usernames.forEach(username => {
        const weekData_user = data[username][week];
        if (weekData_user !== undefined) {
          weekData[username] = weekData_user.position;
        }
      });

      return weekData;
    });
  }, [data, isMobile]);

  // Convertir los datos al formato que necesita Recharts (semanas normales)
  const chartDataNormal = React.useMemo(() => {
    const usernames = Object.keys(data);
    if (usernames.length === 0) return [];

    // Obtener todas las semanas disponibles de los datos
    const allWeeks = new Set<number>();
    usernames.forEach(username => {
      Object.keys(data[username]).forEach(week => {
        allWeeks.add(parseInt(week));
      });
    });

    // Ordenar semanas de menor a mayor (semana 1 a la izquierda)
    const weeks = Array.from(allWeeks).sort((a, b) => a - b);
    
    // En móvil, limitar a las últimas 8 jornadas
    const limitedWeeks = isMobile ? weeks.slice(-8) : weeks;

    // Crear datos para cada semana
    return limitedWeeks.map(week => {
      const weekData: any = { week };
      
      usernames.forEach(username => {
        const weekData_user = data[username][week];
        if (weekData_user !== undefined) {
          weekData[username] = weekData_user.position;
        }
      });

      return weekData;
    });
  }, [data, isMobile]);

  // Obtener la posición final de cada jugador para mostrar sus nombres
  const playerFinalPositions = React.useMemo(() => {
    const usernames = Object.keys(data);
    const finalPositions: { [username: string]: number } = {};
    
    usernames.forEach(username => {
      const weeks = Object.keys(data[username]).map(Number).sort((a, b) => b - a);
      if (weeks.length > 0) {
        const latestWeek = weeks[0]; // La semana más reciente
        finalPositions[username] = data[username][latestWeek].position;
      }
    });
    
    return finalPositions;
  }, [data]);

  // Generar colores únicos para cada jugador
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
    '#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#0000ff',
    '#800080', '#008000', '#ffa500', '#ff69b4', '#00ced1'
  ];

  const usernames = Object.keys(data);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">
          Cargando datos
          <span className="animate-pulse">......</span>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">No hay datos históricos disponibles</div>
      </div>
    );
  }

  return (
    <div className="w-full relative -mx-2">

      {/* Gráfica única con configuración dinámica */}
      <div className={`${isMobile ? 'h-[70vh]' : 'h-96'} relative`}>
        {/* Contenedor principal */}
        <div className="w-full h-full">
          {/* Contenedor con scroll horizontal en móvil */}
          <div className="w-full h-full overflow-x-auto overflow-y-hidden md:overflow-x-visible">
            <div 
              className="h-full w-full md:w-full" 
              style={{ 
                minWidth: isMobile 
                  ? (isLeftToRight ? chartDataNormal : chartData).length > 3 ? '400px' : '100%'
                  : (isLeftToRight ? chartDataNormal : chartData).length > 3 ? '600px' : '100%',
                width: '100%'
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={isLeftToRight ? chartDataNormal : chartData}
                  margin={{
                    top: 20,
                    right: isMobile 
                      ? (isLeftToRight ? 60 : 20)
                      : (isLeftToRight ? 80 : 30),
                    left: isMobile 
                      ? (isLeftToRight ? 5 : 60)
                      : (isLeftToRight ? 10 : 80),
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 0 }} // Ocultar números del eje Y
                    domain={[1, 'dataMax']}
                    reversed={true} // Posición 1 arriba, posición mayor abajo
                  />
                  {usernames.map((username, index) => (
                    <Line
                      key={username}
                      type="monotone"
                      dataKey={username}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Nombres de jugadores - posición dinámica */}
          <div 
            className={`absolute top-0 h-full z-10 bg-background/80 backdrop-blur-sm ${isLeftToRight ? 'right-2' : 'left-0'}`} 
            style={{ width: isMobile ? '50px' : '60px' }}
          >
            {Object.entries(playerFinalPositions)
              .sort(([, posA], [, posB]) => posA - posB) // Ordenar por posición (1 arriba, mayor abajo)
              .map(([username, position], index) => {
                // Distribuir uniformemente entre 6% y 87% según el orden de clasificación
                const totalPlayers = Object.keys(playerFinalPositions).length;
                const yPosition = totalPlayers === 1 
                  ? 46.5 // Si solo hay un jugador, centrarlo entre 6% y 87%
                  : 6 + (index / (totalPlayers - 1)) * 81; // Distribuir entre 6% y 87%
                
                return (
                <div 
                  key={username}
                  className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium truncate flex items-center gap-2 ${isLeftToRight ? '' : 'justify-end'}`}
                  style={{ 
                    position: 'absolute',
                    top: `${yPosition}%`,
                    transform: 'translateY(-50%)',
                    color: 'black'
                  }}
                >
                    {isLeftToRight ? (
                      <>
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ 
                            backgroundColor: colors[usernames.indexOf(username) % colors.length]
                          }}
                        />
                        {username}
                      </>
                    ) : (
                      <>
                        {username}
                        <div 
                          className="w-3 h-3 rounded-full ml-2"
                          style={{ 
                            backgroundColor: colors[usernames.indexOf(username) % colors.length]
                          }}
                        />
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Switch para alternar entre direcciones - Abajo a la derecha */}
      <div className="absolute -bottom-12 right-4 z-20">
        <div className="flex items-center space-x-3 bg-white/95 backdrop-blur-sm rounded-lg p-3 border shadow-lg">
          <span className={`text-sm font-medium ${!isLeftToRight ? 'text-primary' : 'text-muted-foreground'}`}>
            ←
          </span>
          <button
            onClick={() => setIsLeftToRight(!isLeftToRight)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
              isLeftToRight ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isLeftToRight ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isLeftToRight ? 'text-primary' : 'text-muted-foreground'}`}>
            →
          </span>
        </div>
      </div>
    </div>
  );
};
