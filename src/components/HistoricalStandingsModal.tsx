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
  leagueId?: number | null;
}

export const HistoricalStandingsModal: React.FC<HistoricalStandingsModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading = false,
  leagueName,
  leagueId,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto w-[98vw] h-[95vh] sm:w-full sm:h-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg sm:text-xl">
            Evolución de la Clasificación - {leagueName}
          </DialogTitle>
        </DialogHeader>
        <div className="px-2">
          <HistoricalStandingsChart data={data} isLoading={isLoading} leagueId={leagueId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
