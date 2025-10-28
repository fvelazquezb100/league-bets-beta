import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export const LeagueSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [leagueName, setLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { consent } = useCookieConsent();

  useEffect(() => {
    document.title = 'Jambol - Configurar Liga';
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

  const handleCreate = async () => {
    if (!user) return;
    if (!leagueName.trim()) {
      setError('El nombre de la liga es obligatorio');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Use the RPC function that properly creates league and assigns user
      const { error } = await supabase.rpc('create_league_and_join', {
        _user_id: user.id,
        _league_name: leagueName.trim()
      });

      if (error) throw error;

      // Success! Navigate to the homepage.
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Error creating or joining league:', error);
      setError('No se pudo crear la liga. Inténtalo nuevamente');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) return;
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 8) {
      setError('El código debe tener 8 caracteres');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('join_league_with_code', {
        _user_id: user.id,
        _join_code: code,
      });
      
      if (error) {
        setError(error.message || 'No se pudo unir a la liga');
        return;
      }
      if (data !== true) {
        setError('Código inválido o liga no encontrada');
        return;
      }
      navigate('/home', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Error al unirse a la liga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Configurar tu Liga</CardTitle>
          <CardDescription>Elige si quieres crear una liga o unirte con un código</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 mb-6">
            <Button variant={mode === 'create' ? 'default' : 'outline'} onClick={() => setMode('create')}>
              Crear una Liga
            </Button>
            <Button variant={mode === 'join' ? 'default' : 'outline'} onClick={() => setMode('join')}>
              Unirse a una Liga
            </Button>
          </div>

          {mode === 'create' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leagueName">Nombre de la Liga</Label>
                <Input
                  id="leagueName"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  placeholder="Mi Liga de Amigos"
                />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={loading}>
                {loading ? 'Creando...' : 'Crear y Unirme'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joinCode">Código de Unión (8 caracteres)</Label>
                <Input
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="EJEMPLO1"
                  maxLength={8}
                />
              </div>
              <Button className="w-full" onClick={handleJoin} disabled={loading}>
                {loading ? 'Uniendo...' : 'Unirme a la Liga'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
