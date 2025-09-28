import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MagicCard } from '@/components/ui/MagicCard';
import MobileBetSlip from '@/components/MobileBetSlip';
import { useDemoLanguage } from '@/hooks/useDemoLanguage';
import { APP_CONFIG } from '@/config/app';
import { Menu, X, User, DollarSign, History, Settings, CheckCircle, LogOut } from 'lucide-react';

export const BetsDemoMovil = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useDemoLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<'primera' | 'champions'>('primera');
  const [openId, setOpenId] = useState<number | null>(null);
  const [selectedBets, setSelectedBets] = useState<any[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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

    // Expandir automáticamente el primer partido en el paso 2
    if (currentStep === 2) {
      setOpenId(1); // Madrid vs Barça
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
      title: language === 'es' ? "LIGAS DISPONIBLES" : "AVAILABLE LEAGUES",
      content: language === 'es' 
        ? "Aquí puedes seleccionar las ligas en las que quieres apostar. Puedes elegir múltiples ligas para tener más opciones de partidos."
        : "Here you can select the leagues you want to bet on. You can choose multiple leagues to have more match options.",
      highlight: "leagues-tabs"
    },
    {
      title: language === 'es' ? "PARTIDOS DISPONIBLES" : "AVAILABLE MATCHES",
      content: language === 'es' 
        ? "Estos son los partidos disponibles para apostar. Haz clic en un partido para ver los mercados disponibles."
        : "These are the matches available for betting. Click on a match to see the available markets.",
      highlight: "first-match"
    },
    {
      title: language === 'es' ? "MERCADOS DE APUESTAS" : "BETTING MARKETS",
      content: language === 'es' 
        ? "Cada partido tiene diferentes mercados. Selecciona el mercado que te interese y elige tu cuota."
        : "Each match has different markets. Select the market that interests you and choose your odds.",
      highlight: "markets-section"
    },
    {
      title: language === 'es' ? "BOLETO DE APUESTAS" : "BETTING SLIP",
      content: language === 'es' 
        ? "Una vez seleccionada la cuota, aparece en tu boleto de apuestas en la parte inferior. Aquí puedes ver el resumen de tu apuesta y el total de puntos que apostarás. El importe se establece automáticamente en 100 pts para la demo."
        : "Once you select the odds, it appears in your betting slip at the bottom. Here you can see the summary of your bet and the total points you will bet. The amount is automatically set to 100 pts for the demo.",
      highlight: "bet-slip-demo"
    },
    {
      title: language === 'es' ? "REALIZAR APUESTA" : "PLACE BET",
      content: language === 'es' 
        ? "¡Apuesta realizada! Apuesta simple de 100 pts realizada con éxito. Ya tienes tu apuesta registrada y podrás ver los resultados cuando termine el partido. Podrás ver tus apuestas en el historial."
        : "Bet placed! Simple bet of 100 pts placed successfully. Your bet is now registered and you can see the results when the match ends. You can see your bets in the history.",
      highlight: "realizar-apuesta"
    }
  ];

  // Datos estáticos de partidos
  const matches = {
    primera: [
      {
        id: 1,
        home: 'Real Madrid',
        away: 'FC Barcelona',
        date: '2025-09-22T18:00:00Z',
        markets: [
          {
            name: 'Ganador del Partido',
            values: [
              { value: 'Real Madrid', odd: '2.10' },
              { value: 'Empate', odd: '3.20' },
              { value: 'FC Barcelona', odd: '3.50' }
            ]
          },
          {
            name: 'Total Goles',
            values: [
              { value: 'Más de 2.5', odd: '1.80' },
              { value: 'Menos de 2.5', odd: '2.00' }
            ]
          },
          {
            name: 'Ambos Marcan',
            values: [
              { value: 'Sí', odd: '1.60' },
              { value: 'No', odd: '2.30' }
            ]
          }
        ]
      },
      {
        id: 2,
        home: 'Real Betis',
        away: 'Sevilla FC',
        date: '2025-09-22T20:30:00Z',
        markets: [
          {
            name: 'Ganador del Partido',
            values: [
              { value: 'Real Betis', odd: '2.40' },
              { value: 'Empate', odd: '3.10' },
              { value: 'Sevilla FC', odd: '2.90' }
            ]
          }
        ]
      },
      {
        id: 3,
        home: 'Atlético Madrid',
        away: 'Valencia CF',
        date: '2025-09-23T16:00:00Z'
      },
      {
        id: 4,
        home: 'Villarreal CF',
        away: 'Real Sociedad',
        date: '2025-09-23T18:30:00Z'
      },
      {
        id: 5,
        home: 'Athletic Club',
        away: 'Girona FC',
        date: '2025-09-23T21:00:00Z'
      }
    ],
    champions: [
      {
        id: 6,
        home: 'Paris Saint-Germain',
        away: 'Bayern Munich',
        date: '2025-09-24T21:00:00Z'
      },
      {
        id: 7,
        home: 'Manchester City',
        away: 'Inter Milan',
        date: '2025-09-25T21:00:00Z'
      },
      {
        id: 8,
        home: 'Liverpool FC',
        away: 'Arsenal FC',
        date: '2025-09-26T17:30:00Z'
      },
      {
        id: 9,
        home: 'Chelsea FC',
        away: 'Borussia Dortmund',
        date: '2025-09-26T20:00:00Z'
      },
      {
        id: 10,
        home: 'Napoli',
        away: 'Juventus',
        date: '2025-09-27T20:45:00Z'
      }
    ]
  };

  const toggle = (id: number) => {
    setOpenId(prev => prev === id ? null : id);
  };

  const handleAddToSlip = (match: any, marketName: string, selection: any) => {
    const bet = {
      id: `${match.id}-${marketName}-${selection.value}`,
      matchDescription: `${match.home} vs ${match.away}`,
      market: marketName,
      selection: selection.value,
      odds: parseFloat(selection.odd),
      fixtureId: match.id,
      kickoff: match.date,
    };

    // Check if this bet is already selected in the slip
    const existingBet = selectedBets.find(b => b.id === bet.id);
    if (existingBet) {
      // Remove from slip (toggle off)
      setSelectedBets(prev => prev.filter(b => b.id !== bet.id));
      return;
    }

    if (selectedBets.some(b => b.fixtureId === bet.fixtureId)) {
      return;
    }

    setSelectedBets(prev => [...prev, bet]);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Si estamos en el paso 2 (MERCADOS DE APUESTAS), automáticamente seleccionamos Real Madrid
      if (currentStep === 2) {
        const madridMatch = matches.primera[0]; // Real Madrid vs FC Barcelona
        const madridSelection = { value: 'Real Madrid', odd: '2.10' };
        handleAddToSlip(madridMatch, 'Ganador del Partido', madridSelection);
      }
      
      // Si llegamos al paso de "REALIZAR APUESTA", mostramos el mensaje de éxito
      if (currentStep + 1 === 4) {
        setShowSuccessMessage(true);
        // Ocultamos el mensaje después de 3 segundos
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      }
      
      setCurrentStep(currentStep + 1);
    } else {
      // Ir al historial preservando el idioma
      navigate(`/bet-history-demo-movil?lang=${language}`);
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
                <a href="#" className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${currentStep >= 0 ? 'bg-[#FFC72C]/10 text-[#FFC72C] highlight-element' : 'hover:bg-muted/50'}`}>
                  <DollarSign className="w-6 h-6" />
                  <span>Apostar</span>
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

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="w-full px-2 sm:container sm:mx-auto sm:p-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Apuestas</h1>
          
          {/* Mobile Layout */}
          <div className="flex flex-col gap-4 sm:gap-8 w-full">
            <div className="w-full overflow-hidden">
              <Tabs value={selectedLeague} onValueChange={(value) => setSelectedLeague(value as 'primera' | 'champions')} className="w-full">
                <TabsList id="leagues-tabs" className="grid w-full mb-6 gap-2 h-auto grid-cols-2">
                  <TabsTrigger 
                    value="primera" 
                    className="relative overflow-hidden data-[state=active]:ring-2 data-[state=active]:ring-[#FFC72C] data-[state=active]:ring-offset-2"
                  >
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `
                          linear-gradient(45deg, 
                            #C60B1E 0%, #C60B1E 33%, 
                            #FFC400 33%, #FFC400 66%, 
                            #C60B1E 66%, #C60B1E 100%
                          )
                        `,
                        opacity: '0.15'
                      }}
                    />
                    <span className="relative z-10 text-black font-semibold text-xs sm:text-sm leading-tight">La Liga - Primera</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="champions" 
                    className="relative overflow-hidden data-[state=active]:ring-2 data-[state=active]:ring-[#FFC72C] data-[state=active]:ring-offset-2"
                  >
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `
                          linear-gradient(45deg, 
                            #1e40af 0%, #1e40af 33%, 
                            #1e40af 33%, #1e40af 66%, 
                            #ffffff 66%, #ffffff 100%
                          )
                        `,
                        opacity: '0.4'
                      }}
                    />
                    <span className="relative z-10 text-black font-semibold text-xs sm:text-sm leading-tight">Champions League</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="primera" className="mt-0">
                  <div className="flex-grow space-y-8">
                    <div>
                      <h2 className="text-2xl font-semibold mb-4 text-foreground">Cuotas en Vivo</h2>
                      <div className="w-full space-y-4">
                        {matches.primera.map((match) => (
                          <MagicCard
                            key={match.id}
                            enableStars={true}
                            enableSpotlight={true}
                            enableBorderGlow={true}
                            enableTilt={false}
                            clickEffect={false}
                            enableMagnetism={false}
                            particleCount={6}
                            glowColor="255, 199, 44"
                            className="border rounded-lg p-1 sm:p-4 bg-card shadow-sm w-full max-w-none"
                          >
                            <div id={match.id === 1 ? 'first-match' : undefined}>
                              <button
                                onClick={() => toggle(match.id)}
                                className="w-full text-left flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors"
                              >
                                <div className="text-left w-full">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-bold text-sm sm:text-lg text-foreground">{match.home} vs {match.away}</p>
                                      <p className="text-xs sm:text-sm text-muted-foreground">{new Date(match.date).toLocaleString()}</p>
                                    </div>
                                    <svg
                                      className={`w-4 h-4 transition-transform duration-200 ${
                                        openId === match.id ? 'rotate-180' : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                              </button>
                              
                              {openId === match.id && match.markets && (
                                <div id="markets-section" className="space-y-3 sm:space-y-6 pt-1 sm:pt-4 animate-in slide-in-from-top-2 duration-200">
                                  {match.markets.map((market, marketIndex) => (
                                    <div key={marketIndex} className="border rounded-lg p-4">
                                      <h3 className="font-semibold mb-3">{market.name}</h3>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {market.values.map((odd, oddIndex) => {
                                          const isSelected = selectedBets.some(bet => 
                                            bet.fixtureId === match.id && bet.market === market.name && bet.selection === odd.value
                                          );
                                          
                                          return (
                                            <Button
                                              key={oddIndex}
                                              variant={isSelected ? "default" : "outline"}
                                              className={`${
                                                isSelected
                                                  ? 'bg-[#FFC72C] text-black hover:bg-[#e6b328]'
                                                  : 'border-[#FFC72C] text-[#FFC72C] hover:bg-[#FFC72C] hover:text-black'
                                              }`}
                                              onClick={() => handleAddToSlip(match, market.name, odd)}
                                              id={match.id === 1 && market.name === 'Ganador del Partido' && odd.value === 'Real Madrid' ? 'odds-selection' : undefined}
                                            >
                                              <div className="text-center">
                                                <div className="font-medium">{odd.value}</div>
                                                <div className="text-sm opacity-80">{odd.odd}</div>
                                              </div>
                                            </Button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </MagicCard>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="champions" className="mt-0">
                  <div className="flex-grow space-y-8">
                    <div>
                      <h2 className="text-2xl font-semibold mb-4 text-foreground">Cuotas en Vivo</h2>
                      <div className="w-full space-y-4">
                        {matches.champions.map((match) => (
                          <MagicCard
                            key={match.id}
                            enableStars={true}
                            enableSpotlight={true}
                            enableBorderGlow={true}
                            enableTilt={false}
                            clickEffect={false}
                            enableMagnetism={false}
                            particleCount={6}
                            glowColor="255, 199, 44"
                            className="border rounded-lg p-1 sm:p-4 bg-card shadow-sm w-full max-w-none"
                          >
                            <div>
                              <button
                                onClick={() => toggle(match.id)}
                                className="w-full text-left flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors"
                              >
                                <div className="text-left w-full">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-bold text-sm sm:text-lg text-foreground">{match.home} vs {match.away}</p>
                                      <p className="text-xs sm:text-sm text-muted-foreground">{new Date(match.date).toLocaleString()}</p>
                                    </div>
                                    <svg
                                      className={`w-4 h-4 transition-transform duration-200 ${
                                        openId === match.id ? 'rotate-180' : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                              </button>
                            </div>
                          </MagicCard>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Mobile Bet Slip - Static Demo Version */}
            {selectedBets.length > 0 && (
              <div id="bet-slip-demo" className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
                {/* Fixed Bottom Bar - Always Visible when bets selected */}
                <div className="px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Boleto</span>
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          {selectedBets.length}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Cuota: {selectedBets.reduce((acc, bet) => acc * bet.odds, 1).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedBets.length > 0 && (
                        <div className="text-sm font-medium">
                          Ganancia: {(100 * selectedBets.reduce((acc, bet) => acc * bet.odds, 1)).toFixed(2)} pts
                        </div>
                      )}
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Bet Slip Content - Static Demo */}
                <div className="max-h-[60vh] overflow-y-auto px-4 bg-background border-t">
                  <div className="space-y-4 py-4">
                    {/* Selected Bets */}
                    <div className="space-y-3">
                      {selectedBets.map((bet) => (
                        <div key={bet.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{bet.matchDescription}</p>
                              <p className="text-xs text-muted-foreground">{bet.market}</p>
                              <p className="text-sm font-semibold">{bet.selection}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary">{bet.odds.toFixed(2)}</span>
                              <button
                                onClick={() => setSelectedBets(prev => prev.filter(b => b.id !== bet.id))}
                                className="h-6 w-6 p-0 bg-[#FFC72C] text-black hover:bg-[#e6b328] rounded flex items-center justify-center"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      {/* Betting Form - Static Demo */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Importe (pts)</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="100"
                              value="100"
                              readOnly
                              className="w-full px-3 py-2 border rounded-md bg-muted/50 text-muted-foreground"
                            />
                            <div className="absolute right-1 top-0 h-full flex flex-col">
                              <button className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                                ▲
                              </button>
                              <button className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                                ▼
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span>Presupuesto Semanal: <span className="font-semibold">1,250 pts</span></span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Cuota Total:</span>
                            <span className="font-semibold">{selectedBets.reduce((acc, bet) => acc * bet.odds, 1).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ganancia Potencial:</span>
                            <span className="font-semibold text-primary">{(100 * selectedBets.reduce((acc, bet) => acc * bet.odds, 1)).toFixed(2)} pts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Bottom Actions */}
                <div className="px-4 pb-4 pt-2 border-t bg-background">
                  <div className="space-y-2">
                    <button
                      id="realizar-apuesta"
                      className="w-full bg-[#FFC72C] text-black hover:bg-[#e6b328] py-3 px-4 rounded-md font-medium transition-colors"
                    >
                      Realizar Apuestas
                    </button>
                    <button
                      onClick={() => setSelectedBets([])}
                      className="w-full bg-white text-black border border-[#FFC72C] hover:bg-[#FFC72C] hover:text-black py-2 px-4 rounded-md transition-colors"
                    >
                      Limpiar Boleto
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                    : (language === 'es' ? 'Ir al Historial →' : 'Go to History →')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de éxito de apuesta realizada */}
      {showSuccessMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 text-gray-900 px-6 py-4 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <div>
              <p className="font-semibold">¡Apuesta realizada!</p>
              <p className="text-sm text-gray-600">Apuesta simple de 100 pts realizada con éxito</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
