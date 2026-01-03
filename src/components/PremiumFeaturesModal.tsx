import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Crown, Ban, Calendar, RefreshCw, TrendingUp, BarChart3, Settings, Check } from 'lucide-react';

interface PremiumFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumFeaturesModal: React.FC<PremiumFeaturesModalProps> = ({ 
  isOpen, 
  onClose
}) => {
  const premiumFeatures = [
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
            Funcionalidades Premium
          </DialogTitle>
          <DialogDescription className="text-sm pt-1">
            Tu liga tiene acceso a todas estas funcionalidades avanzadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Lista de funcionalidades */}
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

          {/* Mensaje de duración premium */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-3 text-center">
            <p className="text-sm font-medium text-amber-900 mb-1">
              Premium hasta final de temporada 2025-2026 (31/05/2026)
            </p>
            <p className="text-xs text-amber-800">
              Disfruta de todas las ventajas premium sin costo adicional
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

