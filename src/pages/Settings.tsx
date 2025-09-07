import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
}

export const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
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
              .select('name, join_code')
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

  if (loading) return <p>Cargando perfil…</p>;
  if (!profile) return <p>No se pudo cargar el perfil.</p>;

  const displayRole = profile.global_role === 'user' ? 'free' : 'PRO';
  const showUpgradeButton = profile.global_role === 'user';

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Ajustes</h1>
      <div className="grid gap-6 max-w-2xl">

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
                      variant="outline"
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
                    <Button size="sm" onClick={async () => {
                      try {
                        const { error } = await supabase.from('profiles').update({ global_role: 'pro' }).eq('id', profile.id);
                        if (error) throw error;
                        setProfile({ ...profile, global_role: 'pro' });
                        toast({ title: '¡Éxito!', description: 'Usuario actualizado a PRO.' });
                      } catch (error: any) {
                        toast({ title: 'Error', description: error.message || 'No se pudo actualizar a PRO.', variant: 'destructive' });
                      }
                    }}>
                      Actualizar a PRO
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
              
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};