import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, TrendingUp, Users, BarChart3, Award, Star } from 'lucide-react';
import { LeagueStatistics } from '@/hooks/useLeagueStatistics';

interface LeagueStatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  statistics: LeagueStatistics;
  isLoading: boolean;
  leagueName: string;
}

export const LeagueStatisticsModal: React.FC<LeagueStatisticsModalProps> = ({ 
  isOpen, 
  onClose, 
  statistics, 
  isLoading, 
  leagueName 
}) => {

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">Estadísticas de {leagueName}</h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Cargando estadísticas...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profitPercentage = statistics && statistics.totalStake > 0 
    ? ((statistics.netProfit / statistics.totalStake) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Estadísticas de {leagueName}</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Financial Statistics - En recuadro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Estadísticas Financieras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">€{statistics?.totalStake.toFixed(0) || '0'}</div>
                    <div className="text-sm text-muted-foreground">Total Apostado</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">€{statistics?.totalPayout.toFixed(0) || '0'}</div>
                    <div className="text-sm text-muted-foreground">Total Ganado</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className={`text-2xl font-bold ${(statistics?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{statistics?.netProfit.toFixed(0) || '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Beneficio Neto</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className={`text-2xl font-bold ${profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitPercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">% Ganancias</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Statistics - En recuadro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Estadísticas de Boletos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{statistics?.totalBets || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Boletos</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{statistics?.totalWonBets || 0}</div>
                    <div className="text-sm text-muted-foreground">Boletos Ganados</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{statistics?.totalLostBets || 0}</div>
                    <div className="text-sm text-muted-foreground">Boletos Perdidos</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-[#FFC72C]">{statistics?.winPercentage.toFixed(1) || '0.0'}%</div>
                    <div className="text-sm text-muted-foreground">% Victorias</div>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Preferences and Top Players */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preferences */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Preferencias de la Liga
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Mercado Favorito:</span>
                  <div className="text-right">
                    <div className="text-sm text-foreground">{statistics?.mostPopularMarket || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">{statistics?.mostPopularMarketBets || 0} boletos</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Equipo Favorito:</span>
                  <div className="text-right">
                    <div className="text-sm text-foreground">{statistics?.mostPopularTeam || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">{statistics?.mostPopularTeamBets || 0} boletos</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Multiplicador Promedio:</span>
                  <span className="text-sm text-foreground">{statistics?.averageOdds.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Top Players */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Líderes de la Liga
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Más Victorias:</span>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{statistics?.topPlayerByWins.username || 'N/A'}</span>
                    <span className="text-xs text-muted-foreground">({statistics?.topPlayerByWins.wins || 0})</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Mejor % Victorias:</span>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-[#FFC72C]" />
                    <span className="text-sm font-medium">{statistics?.topPlayerByWinRate.username || 'N/A'}</span>
                    <span className="text-xs text-muted-foreground">({statistics?.topPlayerByWinRate.winRate.toFixed(1) || '0.0'}%)</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Más Boletos:</span>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{statistics?.topPlayerByBets.username || 'N/A'}</span>
                    <span className="text-xs text-muted-foreground">({statistics?.topPlayerByBets.bets || 0})</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Mayor Victoria (Puntos):</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{statistics?.topPlayerByBiggestWin.username || 'N/A'}</span>
                    <span className="text-xs text-muted-foreground">({statistics?.topPlayerByBiggestWin.biggestWin || 0} pts)</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Mayor Victoria (Multiplicador):</span>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">{statistics?.topPlayerByHighestOdds.username || 'N/A'}</span>
                    <span className="text-xs text-muted-foreground">({statistics?.topPlayerByHighestOdds.highestOdds || 0.00})</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Total Jugadores:</span>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{statistics?.totalPlayers || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
