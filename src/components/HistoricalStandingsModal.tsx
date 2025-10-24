import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HistoricalStandingsChart } from './HistoricalStandingsChart';
import { HistoricalStandingsData } from '@/hooks/useHistoricalStandings';

interface HistoricalStandingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: HistoricalStandingsData;
  isLoading?: boolean;
  leagueName: string;
}

export const HistoricalStandingsModal: React.FC<HistoricalStandingsModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading = false,
  leagueName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Evolución Histórica de Clasificación - {leagueName}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="mb-4 text-sm text-muted-foreground">
            <p>
              Esta gráfica muestra la evolución de la posición de cada jugador semana a semana.
              La línea más baja representa la posición 1 (primer lugar), y las líneas más altas
              representan posiciones más bajas en la clasificación.
            </p>
          </div>
          <HistoricalStandingsChart data={data} isLoading={isLoading} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
