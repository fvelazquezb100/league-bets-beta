import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Calendar, Home, BarChart3 } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { useDemoLanguage } from '@/hooks/useDemoLanguage';

export const HomeDemo = () => {
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
      
      .overlay-hole {
        position: absolute !important;
        background: transparent !important;
        border-radius: 8px !important;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5) !important;
        pointer-events: none !important;
        transform: scale(1.1) !important;
        transform-origin: center !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // useEffect temporalmente deshabilitado para el agujero
  // useEffect(() => {
  //   // Actualizar posición del agujero para el botón Apostar
  //   if (currentStep === 2) {
  //     const updateHolePosition = () => {
  //       const betsButton = document.getElementById('bets-nav-button');
  //       const holeElement = document.querySelector('.overlay-hole') as HTMLElement;
        
  //       if (betsButton && holeElement) {
  //         const rect = betsButton.getBoundingClientRect();
  //         const padding = 10; // Padding reducido
  //         // Ajustar para el header fijo
  //         holeElement.style.top = `${rect.top - padding}px`;
  //         holeElement.style.left = `${rect.left - padding}px`;
  //         holeElement.style.width = `${rect.width + (padding * 2)}px`;
  //         holeElement.style.height = `${rect.height + (padding * 2)}px`;
  //       }
  //     };

  //     // Actualizar posición inicial
  //     setTimeout(updateHolePosition, 100);

  //     // Escuchar cambios de scroll y resize
  //     window.addEventListener('scroll', updateHolePosition);
  //     window.addEventListener('resize', updateHolePosition);

  //     return () => {
  //       window.removeEventListener('scroll', updateHolePosition);
  //       window.removeEventListener('resize', updateHolePosition);
  //     };
  //   }
  // }, [currentStep]);


  const steps = [
    {
      title: language === 'es' ? "BIENVENIDO A JAMBOL" : "WELCOME TO JAMBOL",
      content: language === 'es' 
        ? "Una liga de simulación de apuestas donde puedes demostrar que sabes más de fútbol que tus amigos. Disfruta de apuestas justas con cuotas en vivo, partidos reales de las mejores ligas del mundo y compite con otros jugadores en un entorno 100% seguro y divertido."
        : "A betting simulation league where you can prove you know more about football than your friends. Enjoy fair betting with live odds, real matches from the world's best leagues and compete with other players in a 100% safe and fun environment.",
      highlight: null
    },
    {
      title: language === 'es' ? "NOTICIAS" : "NEWS",
      content: language === 'es' 
        ? "En esta página puedes ver las noticias importantes de tu liga, como reseteos de puntos y resultados de jornadas."
        : "On this page you can see important news from your league, such as point resets and matchday results.",
      highlight: "news-section"
    },
    {
      title: language === 'es' ? "APUESTAS" : "BETS",
      content: language === 'es' 
        ? "Ahora veremos como apostar para ir ganando puntos en tu liga."
        : "Now we'll see how to bet to earn points in your league.",
      highlight: "bets-nav-button"
    }
  ];


  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Ir a la siguiente página demo preservando el idioma
      navigate(`/bets-demo?lang=${language}`);
    }
  };

  const handleExit = () => {
    window.location.href = '/login';
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-background">
      {/* Header estático */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
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
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                → Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation fija */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-50">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <div className="flex items-center py-4 px-2 text-sm font-medium border-b-2 border-primary text-primary">
              <Home className="w-4 h-4 mr-2" />
              Inicio
            </div>
            <div className="flex items-center py-4 px-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              <BarChart3 className="w-4 h-4 mr-2" />
              Clasificación
            </div>
            <div 
              className="flex items-center py-4 px-2 text-sm font-medium border-b-2 border-transparent text-foreground hover:text-[#FFC72C]"
              id="bets-nav-button"
            >
              $ Apostar
            </div>
            <div className="flex items-center py-4 px-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              <History className="w-4 h-4 mr-2" />
              Historial
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="space-y-8">
          {/* Título de bienvenida */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Bienvenido a tu Liga
            </h1>
            <p className="text-muted-foreground">Mantente al día con las últimas noticias y partidos</p>
          </div>

          {/* Sección de noticias */}
          <div id="news-section">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Noticias y Anuncios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-foreground mb-2">Actualización de puntos - Vuelve la Champion</h3>
                  <p className="text-sm text-foreground/80 mb-2 whitespace-pre-wrap">
                    Los puntos de la jornada 5 han sido reseteados!
                    <br />
Pero lo más importante, vuelven las noches de CHAMPION!
Gestiona bien tus puntos semanales, ahora tendrás 28 partidos donde demostrar tus conocimientos de fútbol!
<br />
Equipo Oficial de la Liga de Simulación Jambol
                  </p>
                  <p className="text-xs text-muted-foreground">
                    16/9/2025, 7:31:48
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-foreground mb-2">¡Bienvenidos a la Liga de Simulación!</h3>
                  <p className="text-sm text-foreground/80 mb-2 whitespace-pre-wrap">
                    "Damos la bienvenida a todos los participantes a nuestra Liga de Simulación de Apuestas Deportivas.
                    <br />
Esperamos que disfruten de la experiencia, compitiendo con estrategia y diversión.
<br />
Recordamos que este es un entorno 100% de simulación, sin dinero real. Nuestro objetivo es ofrecer entretenimiento, análisis deportivo y comunidad.
<br />
Equipo Oficial de la Liga de Simulación Jambol"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    5/9/2025, 10:48:42
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sección de apuestas */}
          <div id="bets-section" className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Próximos Partidos
                </CardTitle>
                <CardDescription>Partidos disponibles para apostar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">FC Barcelona vs Real Madrid</span>
                    <Badge variant="outline">22/9/2025, 18:00</Badge>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>La Liga - Primera</span>
                    <span>3 mercados disponibles</span>
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Real Betis vs Sevilla FC</span>
                    <Badge variant="outline">22/9/2025, 20:30</Badge>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>La Liga - Primera</span>
                    <span>2 mercados disponibles</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>Tus últimas apuestas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-sm">Barcelona vs Madrid</p>
                      <p className="text-xs text-muted-foreground">Ganador del Partido</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+150 pts</p>
                    <p className="text-xs text-muted-foreground">Cuota: 2.50</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-sm">Atletico vs Valencia</p>
                      <p className="text-xs text-muted-foreground">Total Goles</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">-100 pts</p>
                    <p className="text-xs text-muted-foreground">Cuota: 1.80</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      {/* Overlay del tour */}
      {isVisible && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          {/* Overlay temporalmente deshabilitado */}
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
            {/* Botón de salir */}
            <button
              onClick={handleExit}
              className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ×
            </button>
            
            {/* Contenido de la tarjeta */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#FFC72C] mb-4 text-center">
                {currentStepData.title}
              </h2>
              <p className="text-gray-700 mb-6 text-center">
                {currentStepData.content}
              </p>
              
              {/* Botones de navegación */}
              <div className="flex justify-between">
                <Button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="bg-[#FFC72C] text-black hover:bg-[#e6b328] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← {language === 'es' ? 'Anterior' : 'Previous'}
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-[#FFC72C] text-black hover:bg-[#e6b328]"
                >
                  {currentStep < steps.length - 1 
                    ? (language === 'es' ? 'Siguiente →' : 'Next →') 
                    : (language === 'es' ? 'Ir a Apuestas →' : 'Go to Bets →')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
