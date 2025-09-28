import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDemoLanguage } from '@/hooks/useDemoLanguage';
import { APP_CONFIG } from '@/config/app';
import { Menu, X, User, Clock, Settings, CheckCircle, LogOut, TrendingDown, TrendingUp, Calendar, Trophy } from 'lucide-react';

export const BetHistoryDemoMovil = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useDemoLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Mantener el sidebar cerrado en todos los pasos
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentStep]);

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
      title: language === 'es' ? "HISTORIAL DE APUESTAS" : "BET HISTORY",
      content: language === 'es' 
        ? "Aquí puedes ver todas tus apuestas realizadas, tanto las ganadas como las perdidas. Puedes revisar tu rendimiento y estadísticas."
        : "Here you can see all your bets placed, both won and lost. You can review your performance and statistics.",
      highlight: null
    },
    {
      title: language === 'es' ? "ESTADÍSTICAS" : "STATISTICS",
      content: language === 'es' 
        ? "Estas tarjetas muestran un resumen de tu rendimiento: total apostado, total ganado, apuestas pendientes y tu porcentaje de aciertos."
        : "These cards show a summary of your performance: total wagered, total won, pending bets and your success percentage.",
      highlight: "personal-stats"
    },
    {
      title: language === 'es' ? "MIS APUESTAS" : "MY BETS",
      content: language === 'es' 
        ? "Aquí puedes ver el historial completo de todas tus apuestas. Cada entrada muestra el partido, la apuesta realizada, la cuota y el resultado."
        : "Here you can see the complete history of all your bets. Each entry shows the match, the bet placed, the odds and the result.",
      highlight: "bet-history"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Ir a la página de clasificación preservando el idioma
      navigate(`/clasificacion-demo?lang=${language}`);
    }
  };

  const handleExit = () => {
    window.location.href = '/login';
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gray-50">
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
                <a href="#" className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="w-6 h-6 text-muted-foreground">🏆</div>
                  <span className="text-foreground">Clasificación</span>
                </a>
                <a href="#" id="apostar-menu" className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="w-6 h-6 text-muted-foreground">$</div>
                  <span className="text-foreground">Apostar</span>
                </a>
                <a href="#" className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${currentStep >= 0 ? 'bg-[#FFC72C]/10 text-[#FFC72C] highlight-element' : 'hover:bg-muted/50'}`}>
                  <Clock className="w-6 h-6" />
                  <span>Historial</span>
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

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="w-full px-2 sm:container sm:mx-auto sm:p-4">
          {/* Título y descripción */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Historial de Apuestas</h1>
            <p className="text-gray-600">Revisa tu rendimiento y estadísticas de apuestas</p>
          </div>

          {/* Tarjetas de estadísticas */}
          <div id="stats-cards" className="grid grid-cols-2 gap-4 mb-8">
            {/* Total Apostado */}
            <Card className="bg-[#FFC72C]/20 border-[#FFC72C]/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Apostado</p>
                    <p className="text-2xl font-bold text-black">1970</p>
                  </div>
                  <TrendingDown className="w-6 h-6 text-gray-500" />
                </div>
              </CardContent>
            </Card>

            {/* Total Ganado */}
            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Ganado</p>
                    <p className="text-2xl font-bold text-green-600">2036</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Apuestas Pendientes */}
            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Apuestas Pendientes</p>
                    <p className="text-2xl font-bold text-orange-500">0</p>
                  </div>
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas Personales */}
            <Card id="personal-stats" className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estadísticas Personales</p>
                    <p className="text-2xl font-bold text-orange-500">35%</p>
                    <p className="text-xs text-gray-500">% de aciertos de apuestas</p>
                  </div>
                  <Trophy className="w-6 h-6 text-[#FFC72C]" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sección Mis Apuestas */}
          <div id="bet-history">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Mis Apuestas</h2>
              <p className="text-gray-600">Historial completo de todas tus apuestas</p>
            </div>

            {/* Lista de apuestas */}
            <div className="space-y-4">
              {/* Apuesta 1 */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className="bg-[#FFC72C] text-black">Simple</Badge>
                    <span className="text-sm text-gray-500">Semana 2</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Apostado: 10 pts</p>
                    <p className="font-medium text-gray-900">Getafe vs Alaves</p>
                    <p className="text-sm text-gray-700">Ganador del 2do Tiempo: Empate @ 2.05</p>
                    
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-gray-500">(1-1)</span>
                      <span className="font-medium text-gray-900">Ganancia: 21 pts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Apuesta 2 */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className="bg-[#FFC72C] text-black">Simple</Badge>
                    <span className="text-sm text-gray-500">Semana 2</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Apostado: 50 pts</p>
                    <p className="font-medium text-gray-900">Mallorca vs Atletico Madrid</p>
                    <p className="text-sm text-gray-700">Ganador del Partido: Empate @ 3.3</p>
                    
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-gray-500">(1-1)</span>
                      <span className="font-medium text-gray-900">Ganancia: 165 pts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Apuesta 3 - Perdida */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className="bg-[#FFC72C] text-black">Simple</Badge>
                    <span className="text-sm text-gray-500">Semana 1</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Apostado: 30 pts</p>
                    <p className="font-medium text-gray-900">Barcelona vs Real Madrid</p>
                    <p className="text-sm text-gray-700">Ganador del Partido: Barcelona @ 2.1</p>
                    
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-gray-500">(0-2)</span>
                      <span className="font-medium text-red-600">Perdida: -30 pts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Overlay del tour */}
      {isVisible && (
        <div className="fixed inset-0 z-[70] flex justify-center items-center">
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
              className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-[80]"
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
              <div className="flex justify-between relative z-[80]">
                <Button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="bg-[#FFC72C] text-black hover:bg-[#e6b328] disabled:opacity-50 disabled:cursor-not-allowed relative z-[80]"
                >
                  ← {language === 'es' ? 'Anterior' : 'Previous'}
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-[#FFC72C] text-black hover:bg-[#e6b328] relative z-[80]"
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
