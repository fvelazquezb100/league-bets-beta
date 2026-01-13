import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PremiumCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  leagueId: number;
  leagueName: string;
  membersCount: number;
  premiumCost: number;
}

interface DiscountInfo {
  valid: boolean;
  codigo?: string;
  tipo_descuento?: '%' | '€';
  cantidad?: number;
  error?: string;
}

export const PremiumCheckoutModal: React.FC<PremiumCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leagueId,
  leagueName,
  membersCount,
  premiumCost,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [discountCode, setDiscountCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);

  // Calculate final price
  const calculateFinalPrice = (): number => {
    if (!discountInfo || !discountInfo.valid) {
      return premiumCost;
    }

    if (discountInfo.tipo_descuento === '%') {
      const discountAmount = (premiumCost * (discountInfo.cantidad || 0)) / 100;
      return Math.max(0, premiumCost - discountAmount);
    } else {
      // Fixed amount discount (€)
      return Math.max(0, premiumCost - (discountInfo.cantidad || 0));
    }
  };

  const finalPrice = calculateFinalPrice();

  const handleVerifyDiscount = async () => {
    if (!discountCode.trim()) {
      toast({
        title: 'Código requerido',
        description: 'Por favor, introduce un código de descuento',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.rpc('verify_discount_code', {
        discount_code: discountCode.trim(),
      });

      if (error) {
        throw error;
      }

      if (data?.valid) {
        setDiscountInfo(data as DiscountInfo);
        toast({
          title: 'Código válido',
          description: `Descuento aplicado: ${data.tipo_descuento === '%' ? `${data.cantidad}%` : `${data.cantidad}€`}`,
        });
      } else {
        setDiscountInfo({ valid: false, error: data?.error || 'Código inválido' });
        toast({
          title: 'Código inválido',
          description: data?.error || 'El código de descuento no es válido',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error verifying discount:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo verificar el código de descuento',
        variant: 'destructive',
      });
      setDiscountInfo({ valid: false, error: 'Error al verificar el código' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePayPalClick = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes estar autenticado para realizar el pago',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Error',
          description: 'No se pudo obtener la sesión',
          variant: 'destructive',
        });
        return;
      }

      // If final price is 0 (100% discount), upgrade directly without PayPal
      if (finalPrice === 0) {
        const { data, error } = await supabase.functions.invoke('upgrade-league-to-premium', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          throw error;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        toast({
          title: '¡Liga actualizada a Premium!',
          description: 'Tu liga ahora tiene acceso a todas las funcionalidades premium',
        });

        if (onSuccess) {
          onSuccess();
        }
        onClose();
        return;
      }

      // If price > 0, proceed with PayPal payment
      const { data, error } = await supabase.functions.invoke('create-premium-payment', {
        body: {
          amount: finalPrice,
          league_id: leagueId,
          discount_code: discountInfo && discountInfo.valid ? discountInfo.codigo : null,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.approval_url) {
        // Redirect to PayPal approval page
        window.location.href = data.approval_url;
      } else {
        throw new Error('No se recibió la URL de aprobación de PayPal');
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo procesar el pago',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Actualizar a Liga Premium
          </DialogTitle>
          <DialogDescription>
            Completa el pago para actualizar tu liga a premium
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* League Information */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Liga:</span>
              <span className="text-sm">{leagueName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Miembros:</span>
              <span className="text-sm">{membersCount}</span>
            </div>
          </div>

          {/* Discount Code */}
          <div className="space-y-2">
            <Label htmlFor="discount-code">Código de descuento (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="discount-code"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value.toUpperCase());
                  setDiscountInfo(null);
                }}
                placeholder="Ej: BIENVENIDA"
                disabled={isVerifying}
                className="flex-1"
              />
              <Button
                onClick={handleVerifyDiscount}
                disabled={isVerifying || !discountCode.trim()}
                variant="outline"
                className="whitespace-nowrap"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verificar'
                )}
              </Button>
            </div>
            {discountInfo && (
              <div className="flex items-center gap-2 text-sm">
                {discountInfo.valid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">
                      Descuento aplicado: {discountInfo.tipo_descuento === '%' 
                        ? `${discountInfo.cantidad}%` 
                        : `${discountInfo.cantidad}€`}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">{discountInfo.error}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm">Precio base:</span>
              <span className="text-sm font-medium">{premiumCost.toFixed(2)} €</span>
            </div>
            {discountInfo && discountInfo.valid && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">Descuento:</span>
                <span className="text-sm font-medium">
                  -{discountInfo.tipo_descuento === '%'
                    ? `${((premiumCost * (discountInfo.cantidad || 0)) / 100).toFixed(2)} €`
                    : `${discountInfo.cantidad?.toFixed(2)} €`}
                </span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold">Total:</span>
                <span className="text-lg font-bold text-yellow-600">
                  {finalPrice.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          {/* PayPal Button */}
          <Button
            onClick={handlePayPalClick}
            className="w-full bg-[#FFC72C] hover:bg-[#FFB800] text-black font-semibold"
            size="lg"
          >
            Pagar con PayPal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
