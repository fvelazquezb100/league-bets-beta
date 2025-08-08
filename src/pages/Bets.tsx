import { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import BetSlip from '@/components/BetSlip';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// --- Final, Corrected Type Definitions for API-Football Odds Data ---
interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Fixture {
  id: number;
  date: string;
}

interface Teams {
  home: Team;
  away: Team;
}

interface BetValue {
  value: string;
  odd: string;
}

interface BetMarket {
  id: number;
  name: string;
  values: BetValue[];
}

interface Bookmaker {
  id: number;
  name: string;
  bets: BetMarket[];
}

interface MatchData {
  fixture: Fixture;
  teams: Teams;
  bookmakers: Bookmaker[];
}

interface CachedOddsData {
  response?: MatchData[];
}

const Bets = () => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBets, setSelectedBets] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOdds = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: cacheData, error: cacheError } = await supabase
          .from('match_odds_cache')
          .select('data')
          .single();

        if (cacheError || !cacheData || !cacheData.data) {
          throw new Error('Failed to fetch data from cache or cache is empty.');
        }

        const apiData = cacheData.data as unknown as CachedOddsData;
        
        // CRITICAL DEBUGGING STEP: This will show you the raw data in the browser console.
        console.log("Data from cache:", apiData);

        if (apiData && Array.isArray(apiData.response)) {
          const validMatches = apiData.response.filter(match => 
            match.fixture && match.teams?.home && match.teams?.away
          );
          setMatches(validMatches);
        } else {
          setMatches([]);
        }

      } catch (err: any) {
        setError('Failed to fetch or parse live betting data. Please try again later.');
        console.error("Error details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOdds();
  }, []);

  const handleAddToSlip = (match: MatchData, marketName: string, selection: BetValue) => {
    const bet = {
      id: `${match.fixture.id}-${marketName}-${selection.value}`,
      matchDescription: `${match.teams.home.name} vs ${match.teams.away.name}`,
      market: marketName,
      selection: selection.value,
      odds: parseFloat(selection.odd),
    };

    if (selectedBets.some(b => b.id === bet.id)) {
      toast({
        title: 'Bet already in slip',
        description: 'You have already added this selection to your bet slip.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedBets(prev => [...prev, bet]);
    toast({
      title: 'Bet added to slip!',
      description: `${selection.value} @ ${selection.odd}`,
    });
  };

  const findMarket = (match: MatchData, marketName: string) => {
    if (!match.bookmakers || match.bookmakers.length === 0) return undefined;
    for (const bookmaker of match.bookmakers) {
        const market = bookmaker.bets.find(bet => bet.name === marketName);
        if (market) return market;
    }
    return undefined;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-grow space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-wh