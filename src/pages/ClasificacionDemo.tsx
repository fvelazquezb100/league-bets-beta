import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Home, BarChart3, History, Calendar, Award, ArrowDown } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { useDemoLanguage } from '@/hooks/useDemoLanguage';

export const ClasificacionDemo = () => {
  const navigate = useNavigate();
  const { language } = useDemoLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

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
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={APP_CONFIG.ASSETS.LOGO} 
                alt="Jambol" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-foreground">JAMBOL</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Demo User</span>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                → Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-50">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <div className="flex items-center py-4 px-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-[#FFC72C]">
              <Home className="w-4 h-4 mr-2" />
              Inicio
            </div>
            <div className="flex items-center py-4 px-2 text-sm font-medium border-b-2 border-[#FFC72C] text-[#FFC72C]">
              <BarChart3 className="w-4 h-4 mr-2" />
              Clasificación
            </div>
            <div className="flex items-center py-4 px-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-[#FFC72C]">
              $ Apostar
            </div>
            <div className="flex items-center py-4 px-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-[#FFC72C]">
              <History className="w-4 h-4 mr-2" />
              Historial
            </div>
          </div>
        </div>
      </nav>

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
