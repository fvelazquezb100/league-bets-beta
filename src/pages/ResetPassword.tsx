import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';

export const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    // SEO: title, description, canonical
    const title = 'Jambol - Restablecer Contraseña';
    const description = 'Restablece tu contraseña de Jambol de forma segura.';
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/reset-password`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://betadonas.lovable.app/update-password',
      });
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <main className="w-full max-w-md">
        <header className="text-center mb-8">
          <Link to="/" className="flex flex-col items-center gap-4">
            <img 
              src={APP_CONFIG.ASSETS.LOGO} 
              alt="Jambol Logo" 
              className="h-16 jambol-logo"
            />
            <span className="text-3xl font-bold jambol-dark">Jambol</span>
          </Link>
        </header>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
            <CardDescription>
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.
                </p>
                <Button asChild className="jambol-button">
                  <Link to="/login">Volver al inicio de sesión</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@ejemplo.com"
                  />
                </div>

                <Button type="submit" className="jambol-button w-full" disabled={isLoading}>
                  {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
