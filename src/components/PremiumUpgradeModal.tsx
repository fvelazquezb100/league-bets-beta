import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check, Ban, Calendar, RefreshCw, Settings, TrendingUp, BarChart3, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { PremiumCheckoutModal } from './PremiumCheckoutModal';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Get user profile to get league_id
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('league_id')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const leagueId = profile?.league_id;

  // Get league pricing information
  const { data: leaguePricing, isLoading: isLoadingPricing } = useQuery({
    queryKey: ['league-pricing', leagueId],
    queryFn: async () => {
      if (!leagueId) return null;
      const { data, error } = await supabase
        .from('leagues_with_pricing')
        .select('id, name, members_realtime, premium_cost_realtime')
        .eq('id', leagueId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!leagueId,
  });

  const handleUpgradeClick = () => {
    if (!leaguePricing) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de la liga',
        variant: 'destructive',
      });
      return;
    }
    setIsCheckoutOpen(true);
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
            onClick={handleUpgradeClick}
            disabled={isLoadingPricing || !leaguePricing}
            className="w-full bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-3 text-center hover:from-yellow-100 hover:to-amber-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p className="text-base font-bold text-amber-900 mb-1">
              {isLoadingPricing 
                ? 'Cargando...' 
                : leaguePricing 
                  ? `${leaguePricing.premium_cost_realtime?.toFixed(2) || '0.00'} € hasta final de temporada`
                  : 'Cargando precio...'}
            </p>
            <p className="text-xs text-amber-800">
              Actualiza ahora y disfruta de todas las ventajas premium
            </p>
          </button>
        </div>
      </DialogContent>

      {/* Checkout Modal */}
      {leaguePricing && (
        <PremiumCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => {
            if (onSuccess) {
              onSuccess();
            }
          }}
          leagueId={leaguePricing.id}
          leagueName={leaguePricing.name || ''}
          membersCount={leaguePricing.members_realtime || 0}
          premiumCost={Number(leaguePricing.premium_cost_realtime) || 0}
        />
      )}
    </Dialog>
  );
};

