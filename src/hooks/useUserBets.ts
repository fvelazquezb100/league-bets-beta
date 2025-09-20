import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for user bets
export interface UserBet {
  id: number;
  stake: number;
  status: string;
  bet_type: string;
  match_description?: string;
  fixture_id?: number;
  bet_selection?: string;
  market_bets?: string;
  payout?: number;
  odds?: number;
  week?: string;
  created_at?: string;
  bet_selections?: {
    id?: number;
    market: string;
    selection: string;
    odds: number;
    fixture_id?: number;
    match_description?: string;
    status?: string;
  }[];
}

// Fetch pending user bets
const fetchUserBets = async (userId: string): Promise<UserBet[]> => {
  const { data: betsData, error: betsError } = await supabase
    .from('bets')
    .select(`
      id,
      stake,
      status,
      bet_type,
      match_description,
      fixture_id,
      bet_selection,
      market_bets,
      payout,
      odds,
      week,
      created_at,
      bet_selections (
        id,
        market,
        selection,
        odds,
        fixture_id,
        match_description,
        status
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (betsError) {
    throw new Error(`Failed to fetch user bets: ${betsError.message}`);
  }

  return betsData as UserBet[] || [];
};

// Fetch all user bets (for history)
const fetchAllUserBets = async (userId: string): Promise<UserBet[]> => {
  const { data: betsData, error: betsError } = await supabase
    .from('bets')
    .select(`
      id,
      stake,
      status,
      bet_type,
      match_description,
      fixture_id,
      bet_selection,
      market_bets,
      payout,
      odds,
      week,
      created_at,
      bet_selections (
        id,
        market,
        selection,
        odds,
        fixture_id,
        match_description,
        status
      )
    `)
    .eq('user_id', userId);

  if (betsError) {
    throw new Error(`Failed to fetch user bet history: ${betsError.message}`);
  }

  if (!betsData) return [];

  // Get all unique fixture IDs to fetch kickoff times
  const fixtureIds = new Set<number>();
  betsData.forEach(bet => {
    if (bet.fixture_id) {
      fixtureIds.add(bet.fixture_id);
    }
    if (bet.bet_selections) {
      bet.bet_selections.forEach((selection: any) => {
        if (selection.fixture_id) {
          fixtureIds.add(selection.fixture_id);
        }
      });
    }
  });

  // Fetch kickoff times for all fixtures
  const { data: kickoffData } = await supabase
    .from('match_results')
    .select('fixture_id, kickoff_time')
    .in('fixture_id', Array.from(fixtureIds));

  const kickoffMap: Record<number, string> = {};
  kickoffData?.forEach(match => {
    kickoffMap[match.fixture_id] = match.kickoff_time;
  });

  // Sort bets by earliest match kickoff time
  const sortedBets = betsData.sort((a, b) => {
    const getEarliestKickoff = (bet: any): Date => {
      let earliestDate = new Date('2099-12-31'); // Far future as default
      
      // For single bets
      if (bet.fixture_id && kickoffMap[bet.fixture_id]) {
        earliestDate = new Date(kickoffMap[bet.fixture_id]);
      }
      
      // For combo bets, find the earliest match
      if (bet.bet_selections) {
        bet.bet_selections.forEach((selection: any) => {
          if (selection.fixture_id && kickoffMap[selection.fixture_id]) {
            const selectionDate = new Date(kickoffMap[selection.fixture_id]);
            if (selectionDate < earliestDate) {
              earliestDate = selectionDate;
            }
          }
        });
      }
      
      return earliestDate;
    };

    const dateA = getEarliestKickoff(a);
    const dateB = getEarliestKickoff(b);
    
    // Sort by kickoff time descending (most recent matches first)
    return dateB.getTime() - dateA.getTime();
  });

  return sortedBets as UserBet[];
};

// Cancel bet function
const cancelBet = async (betId: number) => {
  const { data, error } = await supabase.rpc('cancel_bet', { 
    bet_id_param: betId 
  });
  
  if (error) {
    throw new Error(error.message);
  }

  if (data && typeof data === 'object' && 'success' in data) {
    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      throw new Error(result.error || 'Failed to cancel bet');
    }
  }

  return data;
};

// Hook for pending user bets
export const useUserBets = (userId?: string) => {
  return useQuery({
    queryKey: ['user-bets', 'pending', userId],
    queryFn: () => fetchUserBets(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds - bets change frequently
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
};

// Hook for all user bets (history)
export const useUserBetHistory = (userId?: string) => {
  return useQuery({
    queryKey: ['user-bets', 'all', userId],
    queryFn: () => fetchAllUserBets(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes - history doesn't change often
  });
};

// Mutation for canceling bets
export const useCancelBet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: cancelBet,
    onSuccess: () => {
      // Invalidate both pending bets and bet history
      queryClient.invalidateQueries({ queryKey: ['user-bets'] });
    },
  });
};
