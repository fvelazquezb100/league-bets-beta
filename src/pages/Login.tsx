import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginInput } from '@/schemas/validation';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { APP_CONFIG } from '@/config/app';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export const Login = () => {
  const { signIn, user, loading } = useAuth();
  const { handleError } = useErrorHandler();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { consent } = useCookieConsent();

  useEffect(() => {
    if (!consent?.analytics) {
      return;
    }

    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-N8SYMCJED4';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-N8SYMCJED4');
    `;
    document.head.appendChild(script2);

    return () => {
      if (script1.parentNode) {
        script1.parentNode.removeChild(script1);
      }
      if (script2.parentNode) {
        script2.parentNode.removeChild(script2);
      }
    };
  }, [consent?.analytics]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img 
            src={APP_CONFIG.ASSETS.LOGO} 
            alt="Jambol Logo" 
            className="h-20 jambol-logo-loading"
          />
          <span className="text-lg font-semibold jambol-dark">Cargando...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setIsLoading(true);

    // Validate form data
    const formData: LoginInput = {
      email,
      password,
    };

    try {
      loginSchema.parse(formData);
    } catch (err: any) {
      const errors: Record<string, string> = {};
      err.errors?.forEach((error: any) => {
        errors[error.path[0]] = error.message;
      });
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signIn(email, password);
      if (error) {
        handleError(error, { component: 'Login', action: 'signIn' });
      }
    } catch (err) {
      handleError(err, { component: 'Login', action: 'signIn' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDemo = () => {
    navigate('/demo-language');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link to="/" className="flex flex-col items-center gap-4">
                <img 
                  src={APP_CONFIG.ASSETS.LOGO} 
                  alt="Jambol Logo" 
                  className="h-16 jambol-logo"
                />
                <span className="text-3xl font-bold jambol-dark">
                  Jambol
                </span>
              </Link>
            </div>
            
            <Card className="shadow-xl border-border/50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
                <CardDescription>
                  Ingresa a tu cuenta para continuar
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="text-right">
                    <Link to="/reset-password" className="text-sm text-primary hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className="w-full jambol-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                  </Button>
                </form>
                
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    ¿No tienes cuenta?{' '}
                    <Link to="/signup" className="text-primary hover:underline font-medium">
                      Regístrate
                    </Link>
                  </p>
                  
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      ¿Quieres hacer una demostración de una liga Jambol?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-white border-[#FFC72C] text-black hover:bg-[#FFC72C] hover:text-white"
                      onClick={handleStartDemo}
                    >
                      Demo Jambol
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right side - Header Logo (Desktop only) */}
        <div className="hidden lg:flex lg:flex-1 lg:relative lg:bg-gradient-to-br lg:from-primary/10 lg:to-accent/10">
          <img 
            src={APP_CONFIG.ASSETS.HEADER_LOGO} 
            alt="Jambol Header" 
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};