import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check, Ban, Calendar, RefreshCw, Settings, TrendingUp, BarChart3, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  onSuccess?: () => void;
}

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({ 
  isOpen, 
  onClose,
  onUpgrade,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('upgrade-league-to-premium');

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.already_premium) {
        toast({
          title: 'Liga Premium',
          description: 'Tu liga ya es premium',
        });
      } else {
        toast({
          title: '¡Liga actualizada a Premium!',
          description: 'Tu liga ahora tiene acceso a todas las funcionalidades premium',
        });
      }

      if (onUpgrade) {
        onUpgrade();
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error: any) {
      console.error('Error upgrading league:', error);
      toast({
        title: 'Error al actualizar',
        description: error.message || 'No se pudo actualizar la liga a premium',
        variant: 'destructive',
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const premiumFeatures = [
    {
      icon: Zap,
      title: 'SuperBoleto',
      description: 'Aumenta tus multiplicadores con SuperBoleto. Configura el límite máximo y multiplicador (1.25x, 1.5x o 2x)',
    },
    {
      icon: Ban,
      title: 'Bloqueo de Partidos',
      description: 'Bloquea partidos específicos a otros jugadores para estrategia avanzada',
    },
    {
      icon: Calendar,
      title: 'Control de Días de Partidos',
      description: 'Gestiona qué días están disponibles los partidos en vivo',
    },
    {
      icon: RefreshCw,
      title: 'Reseteo Manual de Semana',
      description: 'Resetea manualmente la jornada y no esperes al martes',
    },
    {
      icon: TrendingUp,
      title: 'Evolución de Multiplicadores',
      description: 'Visualiza la evolución histórica de los multiplicadores de los partidos',
    },
    {
      icon: BarChart3,
      title: 'Estadísticas Avanzadas de Liga',
      description: 'Accede a estadísticas detalladas y análisis avanzados de tu liga',
    },
    {
      icon: Settings,
      title: 'Configuración Avanzada',
      description: 'Edita nombre, presupuesto, límites de apuestas y más opciones',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-yellow-500" />
            Actualizar a Liga Premium
          </DialogTitle>
          <DialogDescription className="text-sm pt-1">
            Desbloquea todas las funcionalidades avanzadas para tu liga
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Lista de ventajas */}
          <div className="space-y-2">
            {premiumFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-yellow-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-0.5">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                </div>
              );
            })}
          </div>

          {/* Mensaje de oferta - Botón clickeable */}
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="w-full bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-3 text-center hover:from-yellow-100 hover:to-amber-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p className="text-base font-bold text-amber-900 mb-1">
              {isUpgrading ? 'Actualizando...' : 'Gratis hasta final de temporada'}
            </p>
            <p className="text-xs text-amber-800">
              {isUpgrading ? 'Por favor espera...' : 'Actualiza ahora y disfruta de todas las ventajas premium sin costo adicional'}
            </p>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

