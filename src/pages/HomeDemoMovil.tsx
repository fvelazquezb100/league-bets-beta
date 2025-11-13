import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Calendar, Home, BarChart3, Menu } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { useDemoLanguage } from '@/hooks/useDemoLanguage';

export const HomeDemoMovil = () => {
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
      .highlight-element {
        position: relative;
        z-index: 10;
        box-shadow: 0 0 0 4px rgba(255, 199, 44, 0.5) !important;
        border-radius: 8px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
      title: language === 'es' ? "MENÚ DE NAVEGACIÓN" : "NAVIGATION MENU",
      content: language === 'es' 
        ? "En dispositivos móviles, usa el menu (☰) para navegar entre las diferentes secciones: Apuestas, Historial y Clasificación."
        : "On mobile devices, use the menu (☰) to navigate between different sections: Bets, History and Standings.",
      highlight: "mobile-menu"
    },
    {
      title: language === 'es' ? "APUESTAS" : "BETS",
      content: language === 'es' 
        ? "Ahora veremos como apostar para ir ganando puntos en tu liga."
        : "Now we'll see how to bet to earn points in your league.",
      highlight: "sidebar-apostar"
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate(`/bets-demo-movil?lang=${language}`);
    }
  };

  const handleExit = () => {
    navigate('/login');
  };

  // Aplicar resaltado
  useEffect(() => {
    // Limpiar resaltados anteriores
    document.querySelectorAll('.highlight-element').forEach(el => {
      el.classList.remove('highlight-element');
    });

    // Aplicar nuevo resaltado
    if (currentStepData.highlight) {
      const element = document.getElementById(currentStepData.highlight);
      if (element) {
        element.classList.add('highlight-element');
      }
    }
  }, [currentStepData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header móvil */}
      <header className="bg-card border-b border-border/50 shadow-sm bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={APP_CONFIG.ASSETS.LOGO} 
                alt="Jambol Logo" 
                className="h-8 jambol-logo"
              />
              <span className="text-xl font-bold text-foreground">
                Jambol
              </span>
            </div>
            <button 
              className="p-2 rounded-md hover:bg-gray-100"
              id="mobile-menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
          
        </div>
      </header>

      {/* Sidebar móvil que se muestra automáticamente en la demo */}
      {(currentStep === 2 || currentStep === 3) && (
        <div className="fixed inset-0 z-40">
          {/* Overlay de fondo */}
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          
          {/* Sidebar */}
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header del sidebar */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Tu Liga</h2>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Información del usuario */}
              <div className="p-4 border-b">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Demo User</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>1000 pts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <span>Liga Demo</span>
                  </div>
                </div>
              </div>

              {/* Navegación */}
              <div className="flex-1 p-4">
                <nav className="space-y-2">
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100">
                    <Home className="h-4 w-4" />
                    Inicio
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100">
                    <BarChart3 className="h-4 w-4" />
                    Clasificacion
                  </div>
                  <div 
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 ${currentStep === 3 ? 'highlight-element' : ''}`}
                    id="sidebar-apostar"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Apostar
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100">
                    <History className="h-4 w-4" />
                    Historial
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ajustes
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Tu Liga
                  </div>
                </nav>
              </div>

              {/* Botón de cerrar sesión */}
              <div className="p-4 border-t">
                <Button className="w-full gap-2 bg-[#FFC72C] text-black hover:bg-[#e6b328]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="space-y-8">
          {/* Título de bienvenida */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bienvenido a tu Liga
            </h1>
            <p className="text-muted-foreground">
              Gestiona tu liga de apuestas deportivas
            </p>
          </div>

          {/* Sección de noticias */}
          <div id="news-section">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Noticias y Anuncios
                </CardTitle>
                <CardDescription>
                  Mantente al día con las últimas noticias de tu liga
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-4 border shadow-sm">
                  <h4 className="font-semibold text-gray-800">noticia 1</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    contenido de noticia 1
                  </p>
                  <span className="text-xs text-gray-500">20/9/2025, 17:26:07</span>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-4 border shadow-sm">
                  <h4 className="font-semibold text-gray-800">noticia 2</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    contenido noticia 2
                  </p>
                  <span className="text-xs text-gray-500">20/9/2025, 17:26:17</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenido adicional para posicionar la tarjeta APOSTAR abajo */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>
                  Tus últimas acciones en la liga
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">Apuesta realizada</h4>
                      <p className="text-sm text-muted-foreground">Real Madrid vs Barcelona</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">+50 pts</div>
                      <div className="text-xs text-muted-foreground">Hace 2 horas</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">Apuesta realizada</h4>
                      <p className="text-sm text-muted-foreground">Atletico vs Sevilla</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">-25 pts</div>
                      <div className="text-xs text-muted-foreground">Ayer</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Estadísticas Rápidas
                </CardTitle>
                <CardDescription>
                  Tu rendimiento esta semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-[#FFC72C]">75%</div>
                    <div className="text-sm text-muted-foreground">Aciertos</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-[#FFC72C]">+125</div>
                    <div className="text-sm text-muted-foreground">Puntos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Próximos Partidos
                </CardTitle>
                <CardDescription>
                  Encuentra los mejores partidos para apostar hoy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">Getafe vs Alaves</h4>
                      <p className="text-sm text-muted-foreground">24/9/2025, 19:00:00</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#FFC72C]">2.32 | 2.86 | 3.55</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">Atletico Madrid vs Rayo Vallecano</h4>
                      <p className="text-sm text-muted-foreground">24/9/2025, 21:30:00</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#FFC72C]">1.50 | 4.30 | 6.40</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Historial de Apuestas
                </CardTitle>
                <CardDescription>
                  Revisa tus apuestas anteriores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">Barcelona vs Real Madrid</h4>
                      <p className="text-sm text-muted-foreground">Ganador: Barcelona</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">+75 pts</div>
                      <div className="text-xs text-muted-foreground">Finalizado</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">Valencia vs Sevilla</h4>
                      <p className="text-sm text-muted-foreground">Total goles: Más de 2.5</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">-30 pts</div>
                      <div className="text-xs text-muted-foreground">Finalizado</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Clasificación de la Liga
                </CardTitle>
                <CardDescription>
                  Posición actual en tu liga
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#FFC72C] rounded-full flex items-center justify-center">
                        <span className="text-black font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Demo User</h4>
                        <p className="text-sm text-muted-foreground">Tu posición</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#FFC72C]">1,250 pts</div>
                      <div className="text-xs text-muted-foreground">Líder</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Jugador 2</h4>
                        <p className="text-sm text-muted-foreground">Segundo lugar</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-600">1,180 pts</div>
                      <div className="text-xs text-muted-foreground">-70 pts</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Próximos Eventos
                </CardTitle>
                <CardDescription>
                  Eventos especiales de la liga
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">Noche de Champions</h4>
                      <p className="text-sm text-muted-foreground">Doble puntos en partidos de Champions League</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#FFC72C]">Mañana</div>
                      <div className="text-xs text-muted-foreground">20:00</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">Reset Semanal</h4>
                      <p className="text-sm text-muted-foreground">Nuevos puntos y partidos disponibles</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#FFC72C]">Lunes</div>
                      <div className="text-xs text-muted-foreground">00:00</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sección de apuestas - ahora al final */}
          <div id="bets-section" className="grid grid-cols-1 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Más Partidos
                </CardTitle>
                <CardDescription>
                  Otros partidos disponibles para apostar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">Villarreal vs Betis</h4>
                      <p className="text-sm text-muted-foreground">25/9/2025, 16:00:00</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#FFC72C]">2.10 | 3.40 | 3.80</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">Real Sociedad vs Athletic</h4>
                      <p className="text-sm text-muted-foreground">25/9/2025, 18:30:00</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#FFC72C]">2.50 | 3.10 | 2.90</div>
                    </div>
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
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative transition-all duration-700 ease-in-out border-2 border-[#FFC72C] animate-in fade-in-0 zoom-in-95"
            style={{
              transform: currentStep === 0 
                ? 'translateY(-200px) scale(0.95)' 
                : currentStep === 1 
                ? 'translateY(-100px) scale(0.95)' 
                : currentStep === 2
                ? 'translateY(-150px) scale(0.95)'
                : 'translateY(-200px) scale(0.95)'
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
              <p 
                className="text-gray-700 mb-6 text-center"
                dangerouslySetInnerHTML={{ __html: currentStepData.content }}
              />
              
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
