import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';
import { signupSchema, type SignupInput } from '@/schemas/validation';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { SEO } from "@/components/SEO";

export const Signup = () => {
  const { signUp, user, loading } = useAuth();
  const { handleError } = useErrorHandler();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { consent } = useCookieConsent();

  useEffect(() => {
    document.title = 'Jambol — Registro';
  }, []);

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

  // Handle username change - simple for now
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    // Clear error when user starts typing
    if (usernameError) {
      setUsernameError('');
    }
  };

  // Check for invalid characters
  const checkInvalidCharacters = (text: string) => {
    const hasAccents = /[áéíóúÁÉÍÓÚñÑüÜ]/.test(text);
    const hasSpaces = /\s/.test(text);
    const hasSpecialChars = /[^a-zA-Z0-9_]/.test(text);

    if (hasAccents) {
      return 'No se permiten tildes o acentos en el nombre de usuario';
    }
    if (hasSpaces) {
      return 'No se permiten espacios en el nombre de usuario';
    }
    if (hasSpecialChars) {
      return 'Solo se permiten letras, números y guiones bajos';
    }
    return null;
  };

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim()) return null;

    setIsCheckingUsername(true);
    try {
      const { data: isAvailable, error } = await supabase.rpc('check_username_availability', {
        username_to_check: username,
      });

      if (error) {
        return 'Error verificando disponibilidad del nombre de usuario';
      }

      if (!isAvailable) {
        return 'Este nombre de usuario ya está en uso';
      }

      return null; // Username is available
    } catch (err) {
      return 'Error verificando disponibilidad del nombre de usuario';
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Handle username blur - validate when user leaves the field
  const handleUsernameBlur = async () => {
    if (!username.trim()) {
      setUsernameError('');
      return;
    }

    // First validation: invalid characters
    const invalidCharsError = checkInvalidCharacters(username);
    if (invalidCharsError) {
      setUsernameError(invalidCharsError);
      return;
    }

    // Second validation: username availability
    const availabilityError = await checkUsernameAvailability(username);
    if (availabilityError) {
      setUsernameError(availabilityError);
    } else {
      setUsernameError('');
    }
  };

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
    const formData: SignupInput = {
      email,
      password,
      confirmPassword,
      username,
    };

    try {
      signupSchema.parse(formData);
    } catch (err: any) {
      const errors: Record<string, string> = {};
      err.errors?.forEach((error: any) => {
        errors[error.path[0]] = error.message;
      });
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    // TODO: Add validations here step by step

    try {
      const { error } = await signUp(email, password, username);
      if (error) {
        handleError(error, { component: 'Signup', action: 'signUp' });
      } else {
        setSuccess(true);
      }
    } catch (err) {
      handleError(err, { component: 'Signup', action: 'signUp' });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <SEO
          title="Registro Exitoso - Jambol"
          description="Tu cuenta en Jambol ha sido creada exitosamente. Revisa tu correo para confirmar."
        />
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">¡Registro Exitoso!</CardTitle>
            <CardDescription>
              Revisa tu correo para confirmar tu cuenta y luego inicia sesión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="jambol-button w-full">
                Ir a Iniciar Sesión
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
                <CardDescription>
                  Regístrate para empezar a participar
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
                    <Label htmlFor="username">Nombre de Usuario</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={handleUsernameChange}
                      onBlur={handleUsernameBlur}
                      required
                      placeholder="elige-un-usuario"
                    />
                    {usernameError ? (
                      <p className="text-xs text-destructive">
                        {usernameError}
                      </p>
                    ) : isCheckingUsername ? (
                      <p className="text-xs text-muted-foreground">
                        Verificando disponibilidad...
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Elige un nombre único para tu perfil
                      </p>
                    )}
                  </div>

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
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full jambol-primary"
                    disabled={isLoading || isCheckingUsername || !!usernameError}
                  >
                    {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                      Iniciar Sesión
                    </Link>
                  </p>
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
    </div>
  );
};