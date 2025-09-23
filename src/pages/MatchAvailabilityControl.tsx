import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar, Settings, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface AvailabilityDay {
  date: string;
  isEnabled: boolean;
  dayName: string;
  isToday: boolean;
}

export const MatchAvailabilityControl = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check if user is superadmin (same logic as SuperAdminRoute)
  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        setCheckingRole(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('global_role')
        .eq('id', user.id)
        .single();
      setIsSuperAdmin(data?.global_role === 'superadmin');
      setCheckingRole(false);
    };
    checkRole();
  }, [user]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadAvailabilityData();
    }
  }, [isSuperAdmin]);

  const loadAvailabilityData = async () => {
    try {
      setLoading(true);
      
      // Get availability data for the next 15 days
      const { data, error } = await supabase
        .from('match_availability_control' as any)
        .select('date, is_live_betting_enabled')
        .gte('date', new Date().toISOString().split('T')[0])
        .lte('date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date');

      if (error) throw error;

      // Create array of days with availability data
      const today = new Date();
      const days: AvailabilityDay[] = [];

      for (let i = 0; i < 15; i++) {
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
      handleError(error, { context: 'Error loading availability data' });
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (date: string, isEnabled: boolean) => {
    try {
      setSaving(true);
      
      // First try to update existing record
      const { data: existingData, error: selectError } = await supabase
        .from('match_availability_control' as any)
        .select('id')
        .eq('date', date)
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
          .eq('date', date);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('match_availability_control' as any)
          .insert({
            date,
            is_live_betting_enabled: isEnabled,
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
      handleError(error, { context: 'Error updating match availability' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || checkingRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC72C] mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {checkingRole ? 'Verificando permisos...' : 'Cargando configuración...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground">Solo los superadministradores pueden acceder a esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Calendar className="h-8 w-8" />
            Control de Disponibilidad de Partidos
          </h1>
          <p className="text-muted-foreground">
            Gestiona qué días tienen cuotas en vivo habilitadas para todos los usuarios
          </p>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {availabilityDays.map((day) => (
            <Card key={day.date} className={`transition-all duration-200 ${
              day.isEnabled ? 'ring-2 ring-[#FFC72C] bg-[#FFC72C]/10' : 'bg-gray-50'
            }`}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Date Header */}
                  <div className="text-center">
                    <div className="text-sm font-medium text-muted-foreground">
                      {day.dayName}
                    </div>
                    <div className="text-lg font-bold">
                      {new Date(day.date).getDate()}
                    </div>
                    {day.isToday && (
                      <Badge variant="secondary" className="text-xs bg-white text-black border border-[#FFC72C]">
                        Hoy
                      </Badge>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="text-center">
                    <Badge 
                      className={day.isEnabled 
                        ? "bg-[#FFC72C] hover:bg-[#FFC72C]/90 text-black" 
                        : "bg-white text-black border border-[#FFC72C]"
                      }
                    >
                      {day.isEnabled ? "Cuotas en Vivo" : "Solo Próximos"}
                    </Badge>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex justify-center">
                    <Switch
                      checked={day.isEnabled}
                      onCheckedChange={(checked) => toggleAvailability(day.date, checked)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Cuotas en Vivo:</strong> Los usuarios pueden ver y apostar con cuotas reales</p>
            <p>• <strong>Solo Próximos:</strong> Los usuarios ven los partidos pero sin cuotas disponibles</p>
            <p>• <strong>Reset Automático:</strong> Los martes se habilita automáticamente hasta el lunes siguiente</p>
            <p>• <strong>Cambios en Tiempo Real:</strong> Los cambios se aplican inmediatamente para todos los usuarios</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};