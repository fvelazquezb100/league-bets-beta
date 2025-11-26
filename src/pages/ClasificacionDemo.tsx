import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Home, BarChart3, History, Calendar, Award, ArrowDown, Menu, X, User, Settings, CheckCircle, LogOut } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { useDemoLanguage } from '@/hooks/useDemoLanguage';

export const ClasificacionDemo = () => {
  const navigate = useNavigate();
  const { language } = useDemoLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = 'Jambol — Demo';
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Limpiar highlights anteriores
    document.querySelectorAll('.jambol-highlight').forEach(el => {
      el.classList.remove('jambol-highlight');
    });

    // Aplicar highlight al elemento actual si existe
    const currentStepData = steps[currentStep];
    if (currentStepData.highlight) {
      const element = document.getElementById(currentStepData.highlight);
      if (element) {
        element.classList.add('jambol-highlight');
      }
    }
  }, [currentStep]);

  useEffect(() => {
    // Agregar estilos CSS personalizados para el highlight
    const style = document.createElement('style');
    style.textContent = `
      .jambol-highlight {
        animation: jambolPulse 1.6s ease-in-out infinite !important;
        box-shadow: 0 0 0 4px rgba(255, 199, 44, 0.4) !important;
        border-radius: 12px !important;
        transition: all 0.3s ease !important;
        background: rgba(255, 199, 44, 0.05) !important;
      }
      
      @keyframes jambolPulse {
        0% { 
          box-shadow: 0 0 0 4px rgba(255, 199, 44, 0.4);
          background: rgba(255, 199, 44, 0.05);
        }
        50% { 
          box-shadow: 0 0 0 8px rgba(255, 199, 44, 0.7);
          background: rgba(255, 199, 44, 0.1);
        }
        100% { 
          box-shadow: 0 0 0 4px rgba(255, 199, 44, 0.4);
          background: rgba(255, 199, 44, 0.05);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const steps = [
    {
      title: language === 'es' ? "CLASIFICACIÓN DE LA LIGA" : "LEAGUE STANDINGS",
      content: language === 'es' 
        ? "Aquí puedes ver la clasificación de tu liga con todos los participantes ordenados por puntos totales. El jugador con más puntos está en la primera posición."
        : "Here you can see your league standings with all participants ranked by total points. The player with the most points is in first position.",
      highlight: "clasificacion-table"
    },
    {
      title: language === 'es' ? "VER APUESTAS DE OTROS" : "VIEW OTHERS' BETS",
      content: language === 'es' 
        ? "Puedes hacer clic en cualquier jugador para ver su historial de apuestas y analizar su estrategia de juego."
        : "You can click on any player to see their betting history and analyze their game strategy.",
      highlight: "player-row-1"
    },
    {
      title: language === 'es' ? "¡ÚNETE A LA DIVERSIÓN!" : "JOIN THE FUN!",
      content: language === 'es' 
        ? "¡Es hora de que todos participen! Juega con responsabilidad, evalúa los partidos cuidadosamente y, sobre todo, ¡diviértete con tus amigos! La Liga Jambol es el lugar perfecto para demostrar tus conocimientos de fútbol mientras disfrutas de la competencia amistosa."
        : "It's time for everyone to participate! Play responsibly, evaluate matches carefully and, above all, have fun with your friends! Jambol League is the perfect place to demonstrate your football knowledge while enjoying friendly competition.",
      highlight: null
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Scroll automático para mostrar el elemento resaltado
      setTimeout(() => {
        const nextStepData = steps[currentStep + 1];
        if (nextStepData.highlight) {
          const element = document.getElementById(nextStepData.highlight);
          if (element) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }
      }, 100);
    } else {
      // Finalizar tour (redirigir a login)
      window.location.href = '/login';
    }
  };

  const handleExit = () => {
    window.location.href = '/login';
  };

  const currentStepData = steps[currentStep];

  // Datos estáticos de usuarios inventados
  const profiles = [
    { id: '1', username: 'AlexFutbol', total_points: 6460.9, last_week_points: 1469.1 },
    { id: '2', username: 'MariaGol', total_points: 5440.5, last_week_points: 1160.5 },
    { id: '3', username: 'CarlosPro', total_points: 5289.0, last_week_points: 669.9 },
    { id: '4', username: 'AnaChampion', total_points: 5288.7, last_week_points: 1793.5 },
    { id: '5', username: 'DiegoMaster', total_points: 4506.3, last_week_points: 1551.7 },
    { id: '6', username: 'LauraBet', total_points: 4382.5, last_week_points: 418.4 },
    { id: '7', username: 'PabloGamer', total_points: 3524.0, last_week_points: 1470.0 }
  ];

  const handlePlayerClick = (player: { id: string; name: string }) => {
    setSelectedPlayer(player);
    setIsPlayerModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header móvil */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img 
                src={APP_CONFIG.ASSETS.LOGO} 
                alt="Jambol" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-foreground">Jambol</span>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted/50 rounded-md transition-colors"
            >
              <Menu className="w-6 h-6 text-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar móvil */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50">
            <div className="p-6">
              {/* Header del sidebar */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#FFC72C] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Demo User</h3>
                    <p className="text-sm text-muted-foreground">1,250 pts</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-muted/50 rounded-md transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Navegación */}
              <nav className="space-y-2">
                <a href="#" className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="w-6 h-6 text-muted-foreground">🏠</div>
                  <span className="text-foreground">Inicio</span>
                </a>
                <a href="#" className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${currentStep >= 0 ? 'bg-[#FFC72C]/10 text-[#FFC72C] highlight-element' : 'hover:bg-muted/50'}`}>
                  <BarChart3 className="w-6 h-6" />
                  <span>Clasificación</span>
                </a>
                <a href="#" className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="w-6 h-6 text-muted-foreground">$</div>
                  <span className="text-foreground">Apostar</span>
                </a>
                <a href="#" className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <History className="w-6 h-6 text-muted-foreground" />
                  <span className="text-foreground">Historial</span>
                </a>
                <a href="#" className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <Settings className="w-6 h-6 text-muted-foreground" />
                  <span className="text-foreground">Ajustes</span>
                </a>
                <a href="#" className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <CheckCircle className="w-6 h-6 text-muted-foreground" />
                  <span className="text-foreground">Tu Liga</span>
                </a>
              </nav>

              {/* Logout */}
              <div className="mt-8 pt-6 border-t">
                <button className="flex items-center space-x-3 p-3 w-full hover:bg-muted/50 rounded-lg transition-colors">
                  <LogOut className="w-6 h-6 text-muted-foreground" />
                  <span className="text-foreground">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="space-y-6">
          {/* Título de la liga */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Clasificación Demo Jambol
            </h1>
          </div>

          {/* Tabla de clasificación */}
          <Card id="clasificacion-table" className="shadow-lg">
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
                  {profiles.map((profile, index) => (
                    <TableRow 
                      key={profile.id} 
                      id={index === 0 ? "player-row-1" : undefined}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handlePlayerClick({ id: profile.id, name: profile.username })}
                    >
                      <TableCell className="font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{profile.username}</TableCell>
                      <TableCell className="font-medium">{profile.total_points}</TableCell>
                      <TableCell className="font-medium">{profile.last_week_points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de apuestas del jugador */}
      <Dialog open={isPlayerModalOpen} onOpenChange={setIsPlayerModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apuestas de {selectedPlayer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Aquí puedes ver el historial de apuestas de {selectedPlayer?.name} para analizar su estrategia.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Apuestas Ganadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">8</p>
                  <p className="text-sm text-muted-foreground">Últimas 2 semanas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Apuestas Perdidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">3</p>
                  <p className="text-sm text-muted-foreground">Últimas 2 semanas</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Overlay del tour */}
      {isVisible && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative transition-all duration-700 ease-in-out border-2 border-[#FFC72C] animate-in fade-in-0 zoom-in-95"
            style={{
              transform: currentStep === 0 
                ? 'translateY(-200px) scale(0.95)' 
                : 'translateY(-150px) scale(0.95)'
            }}
          >
            <button
              onClick={handleExit}
              className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ×
            </button>
            <div className="p-6 transition-all duration-700 ease-in-out">
              <h2 className="text-2xl font-bold text-[#FFC72C] mb-4 text-left transition-all duration-700 ease-in-out">
                {currentStepData.title}
              </h2>
              <p 
                className="text-gray-700 mb-6 text-left transition-all duration-700 ease-in-out"
                dangerouslySetInnerHTML={{ __html: currentStepData.content }}
              />
              <div className="flex justify-between transition-all duration-700 ease-in-out">
                <Button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="bg-[#FFC72C] text-black hover:bg-[#e6b328] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
                >
                  ← {language === 'es' ? 'Anterior' : 'Previous'}
                </Button>
                      <Button
                        onClick={handleNext}
                        className="bg-[#FFC72C] text-black hover:bg-[#e6b328] transition-all duration-300 ease-in-out"
                      >
                        {currentStep < steps.length - 1 
                          ? (language === 'es' ? 'Siguiente →' : 'Next →') 
                          : (language === 'es' ? 'Finalizar Demo' : 'Finish Demo')}
                      </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
