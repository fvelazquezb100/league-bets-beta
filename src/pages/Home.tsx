import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { DollarSign, History, Trophy, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export const Home = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userBets, setUserBets] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch league standings
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, total_points, league_id')
        .order('total_points', { ascending: false });

      if (profilesData) {
        setProfiles(profilesData);
        const currentUser = profilesData.find(p => p.id === user.id);
        setUserProfile(currentUser);
      }

      // Fetch user's recent bets
      const { data: betsData } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false })
        .limit(5);

      if (betsData) {
        setUserBets(betsData);
      }
    };

    fetchData();
  }, [user]);

  const activeBets = userBets.filter(bet => bet.status === 'pending').length;
  const wonBets = userBets.filter(bet => bet.status === 'won').length;
  const totalBets = userBets.length;
  const winRate = totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0;
  const userPosition = profiles.findIndex(p => p.id === user?.id) + 1;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Clasificación de la Liga
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Tu centro de apuestas simuladas. Demuestra tu conocimiento del fútbol y compite con tus amigos.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Puntos Totales</CardTitle>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{userProfile?.total_points || 0}</div>
            <p className="text-sm text-muted-foreground">Puntos acumulados</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Apuestas Activas</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activeBets}</div>
            <p className="text-sm text-muted-foreground">Pendientes de resultado</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tasa de Acierto</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{winRate}%</div>
            <p className="text-sm text-muted-foreground">De tus apuestas</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Posición Liga</CardTitle>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{userPosition}°</div>
            <p className="text-sm text-muted-foreground">de {profiles.length} jugadores</p>
          </CardContent>
        </Card>
      </div>

      {/* League Standings Table */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Clasificación de la Liga</CardTitle>
          <CardDescription>
            Posiciones actuales de todos los jugadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pos.</TableHead>
                <TableHead>Jugador</TableHead>
                <TableHead>Puntos Totales</TableHead>
                <TableHead>Última Jornada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.slice(0, 10).map((profile, index) => (
                <TableRow key={profile.id} className={profile.id === user?.id ? 'bg-muted/50' : ''}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{profile.username || 'Usuario'}</TableCell>
                  <TableCell>{profile.total_points || 0}</TableCell>
                  <TableCell className="text-muted-foreground">-</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Próximos Partidos</CardTitle>
            <CardDescription>
              Encuentra los mejores partidos para apostar hoy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-semibold">Real Madrid vs Barcelona</p>
                <p className="text-sm text-muted-foreground">Hoy, 21:00</p>
              </div>
              <div className="text-sm font-medium">
                <span className="text-primary">2.1</span> | <span className="text-primary">3.4</span> | <span className="text-primary">2.8</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-semibold">Liverpool vs Arsenal</p>
                <p className="text-sm text-muted-foreground">Mañana, 17:30</p>
              </div>
              <div className="text-sm font-medium">
                <span className="text-primary">1.8</span> | <span className="text-primary">3.2</span> | <span className="text-primary">4.1</span>
              </div>
            </div>
            <Link to="/bets">
              <Button className="w-full mt-4">
                Ver Todos los Partidos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Tus últimas apuestas y resultados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">✓ Valencia vs Sevilla</p>
                <p className="text-sm text-green-600 dark:text-green-400">Ganaste 150 puntos</p>
              </div>
              <div className="text-green-700 dark:text-green-300 font-bold">+150</div>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">✗ Milan vs Inter</p>
                <p className="text-sm text-red-600 dark:text-red-400">Perdiste 100 puntos</p>
              </div>
              <div className="text-red-700 dark:text-red-300 font-bold">-100</div>
            </div>
            <Link to="/bet-history">
              <Button variant="outline" className="w-full mt-4">
                <History className="h-4 w-4 mr-2" />
                Ver Historial Completo
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};