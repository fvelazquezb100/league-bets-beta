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

interface HistoricalStandingsChartProps {
  data: HistoricalStandingsData;
  isLoading?: boolean;
}

export const HistoricalStandingsChart: React.FC<HistoricalStandingsChartProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Cargando evolución histórica...</div>
      </div>
    );
  }

  // Convertir los datos al formato que necesita Recharts
  const chartData = React.useMemo(() => {
    const usernames = Object.keys(data);
    if (usernames.length === 0) return [];

    // Obtener todas las semanas disponibles
    const allWeeks = new Set<number>();
    usernames.forEach(username => {
      Object.keys(data[username]).forEach(week => {
        allWeeks.add(parseInt(week));
      });
    });

    // Ordenar semanas de mayor a menor (semana 5 a la izquierda)
    const weeks = Array.from(allWeeks).sort((a, b) => b - a);

    // Crear datos para cada semana
    return weeks.map(week => {
      const weekData: any = { week };
      
      usernames.forEach(username => {
        const position = data[username][week];
        if (position !== undefined) {
          weekData[username] = position;
        }
      });

      return weekData;
    });
  }, [data]);

  // Obtener la posición final de cada jugador para mostrar sus nombres
  const playerFinalPositions = React.useMemo(() => {
    const usernames = Object.keys(data);
    const finalPositions: { [username: string]: number } = {};
    
    usernames.forEach(username => {
      const weeks = Object.keys(data[username]).map(Number).sort((a, b) => b - a);
      if (weeks.length > 0) {
        const latestWeek = weeks[0]; // La semana más reciente
        finalPositions[username] = data[username][latestWeek];
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

  // Debug: Log data to console
  React.useEffect(() => {
    console.log('HistoricalStandingsChart - Data:', data);
    console.log('HistoricalStandingsChart - ChartData:', chartData);
    console.log('HistoricalStandingsChart - PlayerFinalPositions:', playerFinalPositions);
  }, [data, chartData, playerFinalPositions]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">No hay datos históricos disponibles</div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 80, // Más espacio para los nombres de jugadores
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} />
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 0 }} // Ocultar números del eje Y
            domain={[1, 'dataMax']}
            reversed={true} // Posición 1 arriba, posición mayor abajo
          />
          <Tooltip 
            formatter={(value: any, name: string) => [
              `Posición ${value}`,
              name
            ]}
            labelFormatter={(week) => `Semana ${week}`}
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
      
      {/* Nombres de jugadores posicionados a la izquierda */}
      <div className="absolute left-2 top-0 h-full" style={{ width: '60px' }}>
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
                className="text-xs font-medium truncate"
                style={{ 
                  position: 'absolute',
                  top: `${yPosition}%`,
                  transform: 'translateY(-50%)',
                  color: colors[usernames.indexOf(username) % colors.length]
                }}
              >
                {username}
              </div>
            );
          })}
      </div>
    </div>
  );
};
