import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Home, BarChart3, History, Calendar, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { useDemoLanguage } from '@/hooks/useDemoLanguage';
import { APP_CONFIG } from '@/config/app';

export const BetHistoryDemo = () => {
  const navigate = useNavigate();
  const { language } = useDemoLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    document.title = 'Jambol — Demo';
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // CSS para resaltado
  useEffect(() => {
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
      title: language === 'es' ? "HISTORIAL DE BOLETOS" : "BET HISTORY",
      content: language === 'es' 
        ? "Aquí puedes ver todos tus boletos realizados. En la tabla encontrarás diferentes tipos de boletos:<br />• PERDIDOS<br />• GANADOS<br /> • CANCELADOS<br />• PENDIENTE. Este boleto sí lo puedes cancelar hasta que el partido empiece"
        : "Here you can see all your placed bets. In the table you will find different types of bets:<br />• LOST<br />• WON<br />• CANCELLED<br />• PENDING. This bet you can cancel until the match starts",
      highlight: "bets-table"
    },
    {
      title: language === 'es' ? "FILTROS DE VISUALIZACIÓN" : "VIEW FILTERS",
      content: language === 'es' 
        ? "Estas tarjetas actúan como filtros para facilitar la visualización de tus boletos. Puedes hacer clic en ellas para ver solo los boletos ganados, perdidos o pendientes."
        : "These cards act as filters to facilitate viewing your bets. You can click on them to see only won, lost or pending bets.",
      highlight: "filters-section"
    },
    {
      title: language === 'es' ? "ESTADÍSTICAS PERSONALES" : "PERSONAL STATISTICS",
      content: language === 'es' 
        ? "Aquí puedes ver tus estadísticas detalladas: porcentaje de aciertos, boletos más rentables, y análisis de tu rendimiento. Ahora puedes ver la clasificación de tu liga con los puntos que has sumado."
        : "Here you can see your detailed statistics: hit percentage, most profitable bets, and performance analysis. Now you can see your league standings with the points you have accumulated.",
      highlight: "stats-card"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // Scroll automático para mostrar la siguiente apuesta
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
      // Ir a clasificación preservando el idioma
      navigate(`/clasificacion-demo?lang=${language}`);
    }
  };

  const handleExit = () => {
    window.location.href = '/login';
  };

  const currentStepData = steps[currentStep];

  // Aplicar resaltado
  useEffect(() => {
    document.querySelectorAll('.jambol-highlight').forEach(el => {
      el.classList.remove('jambol-highlight');
    });
    if (currentStepData.highlight) {
      const element = document.getElementById(currentStepData.highlight);
      if (element) {
        element.classList.add('jambol-highlight');
      }
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={APP_CONFIG.ASSETS.LOGO} 
                alt="Jambol Logo" 
                className="h-8 jambol-logo"
              />
              <h1 className="text-2xl font-bold text-foreground">JAMBOL</h1>
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
            <div className="flex items-center py-4 px-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              <Home className="w-4 h-4 mr-2" />
              Inicio
            </div>
            <div className="flex items-center py-4 px-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              <BarChart3 className="w-4 h-4 mr-2" />
              Clasificación
            </div>
            <div className="flex items-center py-4 px-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              $ Apostar
            </div>
            <div className="flex items-center py-4 px-2 text-sm font-medium border-b-2 border-[#FFC72C] text-[#FFC72C]">
              <History className="w-4 h-4 mr-2" />
              Historial
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="w-full px-2 sm:container sm:mx-auto sm:p-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Historial de Boletos</h1>
          
          {/* Tarjetas de estadísticas */}
          <div id="filters-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Apostado</p>
                    <p className="text-2xl font-bold">325</p>
                  </div>
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Ganado</p>
                    <p className="text-2xl font-bold text-green-600">170</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Boletos Pendientes</p>
                    <p className="text-2xl font-bold text-primary">1</p>
                  </div>
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card id="stats-card" className="cursor-pointer transition-all duration-200 hover:bg-primary/10 hover:border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estadísticas Personales</p>
                    <p className="text-2xl font-bold text-primary">33%</p>
                    <p className="text-xs text-muted-foreground">% de aciertos de boletos</p>
                  </div>
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de boletos */}
          <Card id="bets-table" className="shadow-lg">
            <CardHeader>
              <CardTitle>Mis Boletos</CardTitle>
              <CardDescription>Historial completo de todos tus boletos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partido</TableHead>
                    <TableHead>Apuesta</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Ganancia</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Apuesta Perdida */}
                  <TableRow id="lost-bet-row">
                    <TableCell>
                      <div>
                        <div className="font-medium">Mallorca vs Atletico Madrid</div>
                        <div className="text-sm text-muted-foreground">1-1</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        Resultado/Total Goles: Visitante/Más de 1.5 @ 2.30
                      </div>
                    </TableCell>
                    <TableCell>50 pts</TableCell>
                    <TableCell>0 pts</TableCell>
                    <TableCell>
                      <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Perdida
                      </Badge>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>

                  {/* Apuesta Ganada */}
                  <TableRow id="won-bet-row">
                    <TableCell>
                      <div>
                        <div className="font-medium">Villarreal vs Osasuna</div>
                        <div className="text-sm text-muted-foreground">2-1</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        Resultado/Total Goles: Local/Menos de 3.5 @ 2.36
                      </div>
                    </TableCell>
                    <TableCell>50 pts</TableCell>
                    <TableCell>118 pts</TableCell>
                    <TableCell>
                      <Badge className="bg-[#FFC72C] text-black border-2 border-[#FFC72C] hover:bg-[#FFC72C] hover:text-black">
                        Ganada
                      </Badge>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>

                  {/* Apuesta Pendiente */}
                  <TableRow id="pending-bet-row">
                    <TableCell>
                      <div>
                        <div className="font-medium">Real Madrid vs FC Barcelona</div>
                        <div className="text-sm text-muted-foreground">22/9/2025, 20:00:00</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        Ganador del Partido: Empate @ 3.20
                      </div>
                    </TableCell>
                    <TableCell>100 pts</TableCell>
                    <TableCell>320 pts</TableCell>
                    <TableCell>
                      <Badge className="bg-white text-black border-2 border-[#FFC72C] hover:bg-white hover:text-black">
                        Pendiente
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm">
                        Cancelar
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Apuesta Cancelada */}
                  <TableRow id="cancelled-bet-row">
                    <TableCell>
                      <div>
                        <div className="font-medium">Real Betis vs Sevilla FC</div>
                        <div className="text-sm text-muted-foreground">22/9/2025, 20:30:00</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        Ganador del Partido: Real Betis @ 2.40
                      </div>
                    </TableCell>
                    <TableCell>50 pts</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <Badge className="bg-white text-gray-600 border-2 border-gray-400 hover:bg-white hover:text-gray-600">
                        Cancelada
                      </Badge>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Overlay del tour */}
      {isVisible && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative transition-all duration-700 ease-in-out border-2 border-[#FFC72C] animate-in fade-in-0 zoom-in-95"
            style={{
              transform: currentStep === 0 
                ? 'translateY(0px) scale(1)' 
                : currentStep === 1 
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
            <div className="p-6 transition-all duration-500 ease-in-out">
              <h2 className="text-2xl font-bold text-[#FFC72C] mb-4 text-left transition-all duration-500 ease-in-out">
                {currentStepData.title}
              </h2>
              <p 
                className="text-gray-700 mb-6 text-left transition-all duration-500 ease-in-out"
                dangerouslySetInnerHTML={{ __html: currentStepData.content }}
              />
              <div className="flex justify-between transition-all duration-500 ease-in-out">
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
                          : (language === 'es' ? 'Ir a Clasificación →' : 'Go to Standings →')}
                      </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
