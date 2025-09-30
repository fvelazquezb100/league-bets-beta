import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar, Settings, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Link } from 'react-router-dom';

interface AvailabilityDay {
  date: string;
  isEnabled: boolean;
  dayName: string;
  isToday: boolean;
}

export const LeagueMatchAvailabilityControl = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const { data: userProfile } = useUserProfile(user?.id);
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [isLeagueAdmin, setIsLeagueAdmin] = useState(false);
  const [leagueData, setLeagueData] = useState<any>(null);

  // Check if user is league admin
  useEffect(() => {
    const checkRole = async () => {
      if (!user || !userProfile?.league_id) {
        setIsLeagueAdmin(false);
        setCheckingRole(false);
        return;
      }

      // Get league data and check if user is admin
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('id, name, type')
        .eq('id', userProfile.league_id)
        .single();

      if (leagueError) {
        console.error('Error fetching league data:', leagueError);
        setIsLeagueAdmin(false);
        setCheckingRole(false);
        return;
      }

      setLeagueData(league);

      // Check if user is admin of this league
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setIsLeagueAdmin(profile?.role === 'admin_league');
      setCheckingRole(false);
    };
    checkRole();
  }, [user, userProfile]);

  useEffect(() => {
    if (isLeagueAdmin && userProfile?.league_id) {
      loadAvailabilityData();
    }
  }, [isLeagueAdmin, userProfile?.league_id]);

  const loadAvailabilityData = async () => {
    try {
      setLoading(true);
      
      // Get availability data for the next 7 days for this specific league
      const { data, error } = await supabase
        .from('match_availability_control' as any)
        .select('date, is_live_betting_enabled')
        .eq('league_id', userProfile?.league_id)
        .gte('date', new Date().toISOString().split('T')[0])
        .lte('date', getNextMonday())
        .order('date');

      if (error) throw error;

      // Create array of days with availability data
      const today = new Date();
      const days: AvailabilityDay[] = [];

      // Generate next 7 days (today to next Monday)
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = data?.find((item: any) => item.date === dateStr);
        
        days.push({
          date: dateStr,
          isEnabled: (dayData as any)?.is_live_betting_enabled ?? false,
          dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
          isToday: i === 0
        });
      }

      setAvailabilityDays(days);
    } catch (error) {
      handleError(error, { component: 'LeagueMatchAvailabilityControl', action: 'loadAvailabilityData' });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get next Monday
  const getNextMonday = (): string => {
    const today = new Date();
    const nextMonday = new Date(today);
    
    // Find next Monday
    const daysUntilMonday = (1 - today.getDay() + 7) % 7;
    nextMonday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    
    return nextMonday.toISOString().split('T')[0];
  };

  const toggleAvailability = async (date: string, isEnabled: boolean) => {
    try {
      setSaving(true);
      
      // First try to update existing record
      const { data: existingData, error: selectError } = await supabase
        .from('match_availability_control' as any)
        .select('id')
        .eq('date', date)
        .eq('league_id', userProfile?.league_id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      let error;
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('match_availability_control' as any)
          .update({
            is_live_betting_enabled: isEnabled,
            updated_at: new Date().toISOString()
          } as any)
          .eq('date', date)
          .eq('league_id', userProfile?.league_id);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('match_availability_control' as any)
          .insert({
            date,
            is_live_betting_enabled: isEnabled,
            league_id: userProfile?.league_id,
            updated_at: new Date().toISOString()
          } as any);
        error = insertError;
      }

      if (error) {
        console.error('Error updating match availability:', error);
        throw new Error(`Error al actualizar disponibilidad: ${error.message}`);
      }

      // Update local state
      setAvailabilityDays(prev => 
        prev.map(day => 
          day.date === date 
            ? { ...day, isEnabled }
            : day
        )
      );
    } catch (error) {
      handleError(error, { component: 'LeagueMatchAvailabilityControl', action: 'toggleAvailability' });
    } finally {
      setSaving(false);
    }
  };

  if (checkingRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando permisos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLeagueAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground mb-4">
              No tienes permisos para acceder a esta página.
            </p>
            <Link to="/admin-liga">
              <Button variant="outline" className="border-[#FFC72C] bg-white hover:bg-[#FFC72C] hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel de Liga
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const enabledDays = availabilityDays.filter(day => day.isEnabled).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
            <Link to="/admin-liga">
              <Button variant="outline" className="mb-4 border-[#FFC72C] bg-white hover:bg-[#FFC72C] hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel de Liga
              </Button>
            </Link>
        <h1 className="text-3xl font-bold">Control de Disponibilidad de Partidos</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la disponibilidad de apuestas en vivo para {leagueData?.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Control de Disponibilidad de Partidos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Controla qué días están disponibles para apuestas en vivo en {leagueData?.name}
          </p>
          {availabilityDays.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Días activos en los próximos 7 días: {enabledDays} días
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted animate-pulse rounded"></div>
                    <div className="space-y-2">
                      <div className="w-24 h-4 bg-muted animate-pulse rounded"></div>
                      <div className="w-16 h-3 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-muted animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {availabilityDays.map((day) => {
                const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6;
                
                return (
                  <div
                    key={day.date}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      day.isToday ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/20">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {new Date(day.date).toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long' 
                            })}
                          </span>
                          {day.isToday && (
                            <Badge variant="secondary" className="text-xs">
                              Hoy
                            </Badge>
                          )}
                          {isWeekend && (
                            <Badge variant="outline" className="text-xs">
                              Fin de semana
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {day.date}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {day.isEnabled ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          day.isEnabled ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {day.isEnabled ? 'Disponible' : 'No disponible'}
                        </span>
                      </div>
                      
                      <Switch
                        checked={day.isEnabled}
                        onCheckedChange={(checked) => toggleAvailability(day.date, checked)}
                        disabled={saving}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {availabilityDays.length > 0 && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Settings className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Información:</p>
                  <ul className="space-y-1">
                    <li>• Los días marcados como "Disponible" aparecerán en "Cuotas en Vivo"</li>
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
    </div>
  );
};

export default LeagueMatchAvailabilityControl;
