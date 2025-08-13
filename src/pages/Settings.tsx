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
  username: string;
  weekly_budget: number;
  league_id: number | null;
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
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, weekly_budget, league_id')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }

        if (profileData) {
          setProfile(profileData);
          setNewUsername(profileData.username || '');

          // Fetch league data if user is in a league
          if (profileData.league_id) {
            const { data: leagueData, error: leagueError } = await supabase
              .from('leagues')
              .select('name, join_code')
              .eq('id', profileData.league_id)
              .single();

            if (leagueError) {
              console.error('Error fetching league:', leagueError);
            } else if (leagueData) {
              setLeague(leagueData);
            }
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

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de usuario no puede estar vacío.',
        variant: 'destructive',
      });
      return;
    }

    setUsernameLoading(true);
    try {
      const { data, error } = await supabase.rpc('update_username', {
        new_username: newUsername.trim()
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: '¡Éxito!',
          description: 'Nombre de usuario actualizado correctamente.',
        });
        // Update local state
        setProfile(prev => prev ? { ...prev, username: newUsername.trim() } : null);
      } else {
        toast({
          title: 'Error',
          description: data?.message || 'No se pudo actualizar el nombre de usuario.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating username:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el nombre de usuario.',
        variant: 'destructive',
      });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Todos los campos son obligatorios.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La nueva contraseña debe tener al menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: '¡Éxito!',
        description: 'Contraseña actualizada correctamente.',
      });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la contraseña.',
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Ajustes</h1>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

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
                <Input value={profile?.username || ''} disabled className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mi Liga */}
        {profile?.league_id && league && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Mi Liga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Nombre de la Liga</Label>
                  <Input value={league.name} disabled className="mt-1" />
                </div>
                <div>
                  <Label>Código de Unión</Label>
                  <Input value={league.join_code} disabled className="mt-1 font-mono" />
                </div>
                <div>
                  <Label>Presupuesto Semanal</Label>
                  <Input value={`${profile.weekly_budget} pts`} disabled className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cambiar Nombre de Usuario */}
        <Card>
          <CardHeader>
            <CardTitle>Cambiar Nombre de Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUsernameUpdate} className="space-y-4">
              <div>
                <Label htmlFor="newUsername">Nuevo Nombre de Usuario</Label>
                <Input
                  id="newUsername"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Introduce tu nuevo nombre de usuario"
                  className="mt-1"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Debe tener entre 3 y 15 caracteres.
                </p>
              </div>
              <Button type="submit" disabled={usernameLoading}>
                {usernameLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </form>
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