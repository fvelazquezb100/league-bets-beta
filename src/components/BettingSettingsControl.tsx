import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Save, AlertCircle } from 'lucide-react';
import { useBettingSettings } from '@/hooks/useBettingSettings';
import { useToast } from '@/hooks/use-toast';

export const BettingSettingsControl: React.FC = () => {
  const { cutoffMinutes, isLoading, updateCutoffTime, isUpdating, updateError } = useBettingSettings();
  const { toast } = useToast();
  const [newCutoffTime, setNewCutoffTime] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    const minutes = parseInt(newCutoffTime);
    
    if (isNaN(minutes) || minutes < 1 || minutes > 120) {
      toast({
        title: "Error",
        description: "El tiempo debe ser un número entre 1 y 120 minutos",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await updateCutoffTime(minutes);
      
      if (result.success) {
        toast({
          title: "Configuración actualizada",
          description: `Tiempo mínimo de apuestas actualizado a ${minutes} minutos`,
        });
        setIsEditing(false);
        setNewCutoffTime('');
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar la configuración",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar la configuración",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewCutoffTime('');
  };

  const handleEdit = () => {
    setNewCutoffTime(cutoffMinutes.toString());
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC72C] mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando configuración...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Configuración de Tiempo de Apuestas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cutoff-time">Tiempo Mínimo Antes del Partido</Label>
          <div className="flex items-center gap-4">
            {isEditing ? (
              <>
                <Input
                  id="cutoff-time"
                  type="number"
                  min="1"
                  max="120"
                  value={newCutoffTime}
                  onChange={(e) => setNewCutoffTime(e.target.value)}
                  className="w-24"
                  placeholder="15"
                />
                <span className="text-sm text-muted-foreground">minutos</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="bg-white text-black hover:bg-[#FFC72C] hover:text-black border border-gray-300"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isUpdating ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Badge className="text-lg px-3 py-1 bg-[#FFC72C] text-black hover:bg-[#FFC72C]/90">
                  {cutoffMinutes} minutos
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEdit}
                  className="bg-white text-black hover:bg-[#FFC72C] hover:text-black border border-gray-300"
                >
                  Editar
                </Button>
              </>
            )}
          </div>
        </div>

        {updateError && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              Error al actualizar: {updateError.message}
            </span>
          </div>
        )}

        {/* Descripción informativa eliminada a petición: reglas y nota de aplicación inmediata */}
      </CardContent>
    </Card>
  );
};
