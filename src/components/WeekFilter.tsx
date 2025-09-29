import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Calendar } from 'lucide-react';
import { WeekOption } from '@/hooks/useLeagueStandings';

interface WeekFilterProps {
  selectedWeek: string;
  onWeekChange: (week: string) => void;
  availableWeeks: WeekOption[];
  isLoading: boolean;
}

export const WeekFilter: React.FC<WeekFilterProps> = ({
  selectedWeek,
  onWeekChange,
  availableWeeks,
  isLoading
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedWeekLabel = availableWeeks.find(w => w.week === selectedWeek)?.label || 'Clasificación Total';

  const handleWeekSelect = (week: string) => {
    onWeekChange(week);
    setIsOpen(false);
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted/20">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-medium truncate">Filtro por Semana</div>
              <div className="text-xs text-muted-foreground truncate">
                {isLoading ? 'Cargando...' : selectedWeekLabel}
              </div>
            </div>
          </div>
          <div className="relative flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="bg-white border-gray-300 hover:bg-[#FFC72C] hover:border-[#FFC72C] hover:text-[#2D2D2D] flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 p-0"
              disabled={isLoading}
            >
              <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            {isOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 sm:w-48 bg-background border rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {availableWeeks.map((week) => (
                    <button
                      key={week.week}
                      onClick={() => handleWeekSelect(week.week)}
                      className={`w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm hover:bg-muted/50 transition-colors ${
                        selectedWeek === week.week ? 'bg-muted/30 font-medium' : ''
                      }`}
                    >
                      {week.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
