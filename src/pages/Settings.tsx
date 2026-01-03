import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Eye, EyeOff, LogOut, AlertTriangle, Heart, Crown } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { useUserDonations } from '@/hooks/useUserDonations';
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal';

interface Profile {
  id: string;
  username: string;
  weekly_budget: number;
  league_id: number | null;
  global_role: string;
}

interface League {
  name: string;
  join_code: string;
  type: 'free' | 'premium';
}

export const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { consent } = useCookieConsent();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: donationsData } = useUserDonations(user?.id);

  useEffect(() => {
    document.title = 'Jambol — Ajustes';
  }, []);
  
  // Username form state
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameTaken, setIsUsernameTaken] = useState<boolean | null>(null);
  const [usernameMsg, setUsernameMsg] = useState('');
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Leave league state
  const [leaveLeagueLoading, setLeaveLeagueLoading] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, weekly_budget, league_id, global_role')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;
      if (profileData) {
        setProfile(profileData);
        setNewUsername(profileData.username || '');
        if (profileData.league_id) {
          const { data: leagueData, error: leagueError } = await supabase
            .from('leagues')
            .select('name, join_code, type')
            .eq('id', profileData.league_id)
            .single();
          if (!leagueError && leagueData) setLeague(leagueData);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (!user) return;
    fetchUserData();
  }, [user]);

  // Username availability checking
  useEffect(() => {
    if (!isEditingUsername || !newUsername || newUsername === profile?.username) {
      setIsUsernameTaken(null);
      setUsernameMsg('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const { data, error } = await supabase.rpc('check_username_availability', {
          username_to_check: newUsername,
        });
        if (error) {
          console.error('Error checking username:', error);
          setUsernameMsg('Error verificando usuario');
          setIsUsernameTaken(null);
        } else {
          const isAvailable = data === true;
          setIsUsernameTaken(!isAvailable);
          setUsernameMsg(isAvailable ? '' : 'Este nombre de usuario ya está en uso');
        }
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameMsg('Error verificando usuario');
        setIsUsernameTaken(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [newUsername, isEditingUsername, profile?.username]);

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      toast({ title: 'Error', description: 'El nombre de usuario no puede estar vacío.', variant: 'destructive' });
      return;
    }
    if (newUsername.trim() === profile?.username) {
      setIsEditingUsername(false);
      return;
    }
    if (isUsernameTaken) {
      toast({ title: 'Error', description: 'Este nombre de usuario ya está en uso.', variant: 'destructive' });
      return;
    }
    if (newUsername.trim().length < 3) {
      toast({ title: 'Error', description: 'El nombre de usuario debe tener al menos 3 caracteres.', variant: 'destructive' });
      return;
    }
    if (newUsername.trim().length > 15) {
      toast({ title: 'Error', description: 'El nombre de usuario debe tener máximo 15 caracteres.', variant: 'destructive' });
      return;
    }
    
    setUsernameLoading(true);
    try {
      const { data, error } = await supabase.rpc('update_username', { new_username: newUsername.trim() });
      if (error) throw error;
      if (data?.success) {
        toast({ title: '¡Éxito!', description: 'Nombre de usuario actualizado correctamente.' });
        setProfile(prev => prev ? { ...prev, username: newUsername.trim() } : null);
        setIsEditingUsername(false);
        setIsUsernameTaken(null);
        setUsernameMsg('');
      } else {
        toast({ title: 'Error', description: data?.message || 'No se pudo actualizar el nombre de usuario.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo actualizar el nombre de usuario.', variant: 'destructive' });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleCancelUsernameEdit = () => {
    setNewUsername(profile?.username || '');
    setIsEditingUsername(false);
    setIsUsernameTaken(null);
    setUsernameMsg('');
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'Todos los campos son obligatorios.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'La nueva contraseña debe tener al menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: '¡Éxito!', description: 'Contraseña actualizada correctamente.' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo actualizar la contraseña.', variant: 'destructive' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLeaveLeague = async () => {
    if (!user) return;
    
    setLeaveLeagueLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('leave-league', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Liga abandonada',
          description: 'Has salido de la liga exitosamente. Tus puntos y boletos han sido reseteados.',
        });
        
        // Refresh user data
        await fetchUserData();
      } else {
        throw new Error(data.error || 'Error al salir de la liga');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo salir de la liga',
        variant: 'destructive',
      });
    } finally {
      setLeaveLeagueLoading(false);
    }
  };

  const handleDonationClick = () => {
    if (!user || !profile) {
      toast({
        title: 'Error',
        description: 'Debes estar autenticado para realizar una donación',
        variant: 'destructive',
      });
      return;
    }

    // Crear objeto con información personalizada para PayPal
    const customData = {
      user_id: user.id,
      payment_type: 'donation',
      league_id: profile.league_id || null,
    };

    // Codificar como JSON string para el parámetro custom de PayPal
    const customParam = encodeURIComponent(JSON.stringify(customData));

    // Usar el botón hosted de PayPal y añadir el parámetro custom dinámicamente
    // Nota: El notify_url y otras variables estáticas deben estar configuradas
    // en el Button Manager de PayPal. El parámetro custom se añade aquí dinámicamente.
    const paypalUrl = `https://www.paypal.com/donate/?hosted_button_id=M56PD6EZ7DZQE&custom=${customParam}`;
    
    window.open(paypalUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <p>Cargando perfil…</p>;
  if (!profile) return <p>No se pudo cargar el perfil.</p>;

  const displayRole = profile.global_role === 'user' ? 'free' : 'PRO';
  const showUpgradeButton = profile.global_role === 'user';

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Ajustes</h1>
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        {/* Mi Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mi Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="mt-1" />
              </div>
              <div>
                <Label>Nombre de Usuario</Label>
                {isEditingUsername ? (
                  <form onSubmit={handleUsernameUpdate} className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="Introduce tu nombre de usuario"
                          className="mt-1"
                          disabled={usernameLoading}
                        />
                        {isCheckingUsername && (
                          <p className="text-sm text-muted-foreground mt-1">Verificando disponibilidad...</p>
                        )}
                        {usernameMsg && (
                          <p className={`text-sm mt-1 ${isUsernameTaken ? 'text-red-500' : 'text-green-500'}`}>
                            {usernameMsg}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={usernameLoading || isUsernameTaken || newUsername.trim() === profile?.username}
                        >
                          {usernameLoading ? 'Guardando...' : 'Guardar'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="bg-white text-black border-2 border-[#FFC72C] hover:bg-white hover:text-black"
                          onClick={handleCancelUsernameEdit}
                          disabled={usernameLoading}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      El nombre de usuario debe tener entre 3 y 15 caracteres.
                    </p>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={profile.username || ''} disabled className="flex-1" />
                    <Button
                      className="jambol-button"
                      size="sm"
                      onClick={() => setIsEditingUsername(true)}
                    >
                      Editar
                    </Button>
                  </div>
                )}
              </div>
              <div>
                
                <div className="flex items-center gap-3 mt-1">
                  <span>{`usuario ${displayRole}`}</span>
                  {showUpgradeButton && (
                    <Button 
                      size="sm" 
                      onClick={() => {
                        toast({ 
                          title: 'Próximamente', 
                          description: 'Próximamente podrás disfrutar de ventajas siendo PRO' 
                        });
                      }}
                    >
                      Actualizar a PRO
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liga Premium */}
        {profile.league_id && (
          <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50/50 to-amber-50/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                Liga Premium
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {league?.type === 'premium' ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-3">
                      <Crown className="h-8 w-8 text-yellow-600" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Tu liga es Premium
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Disfruta de todas las funcionalidades avanzadas
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Premium hasta final de temporada 2025-2026 (31/05/2026)
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Actualiza a premium para desbloquear funcionalidades avanzadas como bloqueo de partidos, control de disponibilidad y más.
                    </p>
                    <Button
                      className="w-full jambol-button bg-[#FFC72C] text-black hover:bg-[#FFD54F]"
                      onClick={() => setIsPremiumModalOpen(true)}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Actualizar a Premium
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cambiar Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Introduce tu contraseña actual"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Introduce tu nueva contraseña"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu nueva contraseña"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                La contraseña debe tener al menos 6 caracteres.
              </p>
              
              <Button type="submit" disabled={passwordLoading} className="w-full">
                {passwordLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Apoyar nuestro proyecto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Apoyar nuestro proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Si disfrutas usando Jambol y quieres ayudarnos a seguir mejorando, considera apoyarnos. 
                Tu contribución nos ayuda a mantener y mejorar el servicio.
              </p>
              <Button
                onClick={handleDonationClick}
                className="w-full jambol-button bg-[#FFC72C] text-black hover:bg-[#FFD54F]"
              >
                <Heart className="h-4 w-4 mr-2" />
                Apoyar con PayPal
              </Button>
              {donationsData?.hasDonated && (
                <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg text-center">
                  <p className="text-sm font-medium text-amber-800 flex items-center justify-center gap-2">
                    <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                    ¡Gracias por apoyarnos!
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Tu apoyo nos ayuda a seguir mejorando Jambol
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leave League Card */}
        {profile.league_id && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                Salir de la Liga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Acción irreversible</p>
                  <p className="text-sm text-muted-foreground">
                    Al salir de la liga, se resetearán todos tus puntos (totales y de la última semana) a cero, 
                    y todos tus boletos se marcarán como semana 0. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="jambol-button border-2 border-[#FFC72C] hover:bg-[#FFC72C] hover:text-black w-full"
                    disabled={leaveLeagueLoading}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {leaveLeagueLoading ? 'Saliendo...' : 'Salir de la Liga'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      ¿Estás seguro?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>Esta acción es <strong>irreversible</strong> y tendrá las siguientes consecuencias:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Todos tus puntos totales se resetearán a <strong>0</strong></li>
                        <li>Tus puntos de la última semana se resetearán a <strong>0</strong></li>
                        <li>Serás removido de la liga actual</li>
                        <li>Todos tus boletos se marcarán como semana <strong>0</strong></li>
                      </ul>
                      <p className="font-medium text-amber-600">
                        ¿Estás completamente seguro de que quieres continuar?
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleLeaveLeague}
                      className="jambol-button border-2 border-[#FFC72C] hover:bg-[#FFC72C] hover:text-black"
                      disabled={leaveLeagueLoading}
                    >
                      {leaveLeagueLoading ? 'Saliendo...' : 'Sí, salir de la liga'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </div>

      <PremiumUpgradeModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onSuccess={async () => {
          // Refresh user data to get updated league type
          await fetchUserData();
        }}
      />
    </div>
  );
};