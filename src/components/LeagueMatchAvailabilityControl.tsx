import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, Settings } from 'lucide-react';
import { useLeagueMatchAvailability, useToggleLeagueAvailability } from '@/hooks/useLeagueMatchAvailability';

interface LeagueMatchAvailabilityControlProps {
  leagueId: number;
  leagueName: string;
}

export const LeagueMatchAvailabilityControl: React.FC<LeagueMatchAvailabilityControlProps> = ({
  leagueId,
  leagueName
}) => {
  const [saving, setSaving] = useState(false);
  const { data: availabilityData, isLoading, error } = useLeagueMatchAvailability(leagueId);
  const toggleAvailability = useToggleLeagueAvailability(leagueId);

  const handleToggle = async (date: string, isEnabled: boolean) => {
    try {
      setSaving(true);
      await toggleAvailability.mutateAsync({ date, isEnabled });
    } catch (error) {
      console.error('Error toggling availability:', error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Control de Disponibilidad de Partidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando disponibilidad...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Control de Disponibilidad de Partidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Error al cargar la disponibilidad</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Control de Disponibilidad de Partidos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Controla qué días están disponibles los partidos en vivo en {leagueName}
        </p>
        {availabilityData && availabilityData.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Días activos en los próximos 7 días: {availabilityData.filter(item => item.is_live_betting_enabled).length} días
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {availabilityData && availabilityData.length > 0 ? (
            availabilityData.map((item) => {
              const date = new Date(item.date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              
              return (
                <div
                  key={item.date}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isToday ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {date.toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.date}
                        {isToday && ' (Hoy)'}
                        {isWeekend && ' (Fin de semana)'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.is_live_betting_enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_live_betting_enabled ? 'Disponible' : 'No disponible'}
                    </span>
                    
                    <Switch
                      checked={item.is_live_betting_enabled}
                      onCheckedChange={(checked) => handleToggle(item.date, checked)}
                      disabled={saving}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No hay fechas disponibles para configurar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Las fechas se generan automáticamente cada martes
              </p>
            </div>
          )}
        </div>
        
        {availabilityData && availabilityData.length > 0 && (
          <div className="mt-6 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Settings className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Información:</p>
                <ul className="space-y-1">
                  <li>• Los días marcados como "Disponible" aparecerán en "Partidos disponibles"</li>
                  <li>• Los días marcados como "No disponible" aparecerán en "Próximos Encuentros"</li>
                  <li>• Los cambios se aplican inmediatamente para todos los usuarios de la liga</li>
                  <li>• Las fechas se actualizan automáticamente cada martes</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
