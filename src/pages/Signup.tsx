import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const Signup = () => {
  const { signUp, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameTaken, setIsUsernameTaken] = useState<boolean | null>(null);
  const [usernameMsg, setUsernameMsg] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!username) {
      setIsUsernameTaken(null);
      setUsernameMsg('');
      return;
    }

    const t = setTimeout(async () => {
      setIsCheckingUsername(true);
      const { data, error } = await supabase.rpc('check_username_availability', {
        username_to_check: username,
      });
      if (error) {
        console.error('Error verificando usuario:', error);
        setUsernameMsg('Error verificando usuario');
        setIsUsernameTaken(null);
      } else {
        const exists = data === false;
        setIsUsernameTaken(exists);
        setUsernameMsg(exists ? 'Este nombre de usuario ya está en uso' : '');
      }
      setIsCheckingUsername(false);
    }, 400);

    return () => clearTimeout(t);
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/jambollogo.png" 
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
    setIsLoading(true);

    if (!username) {
      setError('El nombre de usuario es requerido');
      setIsLoading(false);
      return;
    }

    if (isUsernameTaken) {
      setError('El nombre de usuario ya está en uso');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, username);
      if (error) {
        if (error.message.includes('already registered')) {
          setError('Este correo ya está registrado');
        } else {
          setError(error.message);
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">¡Registro Exitoso!</CardTitle>
            <CardDescription>
              Revisa tu correo para confirmar tu cuenta y luego inicia sesión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full">
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
                  src="https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/jambollogo.png" 
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
                  Regístrate para empezar a apostar
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
                      onChange={(e) => setUsername(e.target.value.trim())}
                      required
                      placeholder="elige-un-usuario"
                    />
                    <p className={`text-xs ${isUsernameTaken ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {isCheckingUsername
                        ? 'Verificando disponibilidad...'
                        : isUsernameTaken === null && !username
                        ? 'Elige un nombre único para tu perfil'
                        : isUsernameTaken
                        ? 'Este nombre de usuario ya está en uso'
                        : username
                        ? 'Disponible'
                        : ''}
                    </p>
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
                    disabled={isLoading || isCheckingUsername || isUsernameTaken === true}
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
            src="https://sbfgxxdpppgtgiclmctc.supabase.co/storage/v1/object/public/media/headerlogocort.png" 
            alt="Jambol Header" 
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
};