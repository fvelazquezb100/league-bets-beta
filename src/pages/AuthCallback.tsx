import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';

/**
 * AuthCallback handles Supabase auth redirects with token_hash
 * Supports: recovery (password reset), signup confirmation, magic links
 */
export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') as 'recovery' | 'signup' | 'magiclink' | 'email' | null;

      if (!tokenHash || !type) {
        setError('Enlace inválido o expirado.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type,
        });

        if (verifyError) {
          console.error('OTP verification error:', verifyError);
          setError('El enlace ha expirado o es inválido. Por favor, solicita uno nuevo.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Redirect based on type
        switch (type) {
          case 'recovery':
            // Pass state to indicate we came from a valid recovery flow
            navigate('/update-password', { state: { fromRecovery: true }, replace: true });
            break;
          case 'signup':
          case 'email':
            // Email confirmed, redirect to home or login
            navigate('/home');
            break;
          case 'magiclink':
            navigate('/home');
            break;
          default:
            navigate('/home');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Error de conexión. Inténtalo de nuevo.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center space-y-4">
        <img 
          src={APP_CONFIG.ASSETS.LOGO} 
          alt="Jambol Logo" 
          className="h-16 mx-auto jambol-logo"
        />
        {error ? (
          <div className="space-y-2">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-sm text-muted-foreground">Redirigiendo...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-medium">Verificando...</p>
            <p className="text-sm text-muted-foreground">Por favor espera un momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

