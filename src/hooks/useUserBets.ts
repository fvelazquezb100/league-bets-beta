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
  bet_selections?: {
    market: string;
    selection: string;
    odds: number;
    fixture_id?: number;
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
      bet_selections (
        market,
        selection,
        odds,
        fixture_id
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
      created_at,
      bet_selections (
        market,
        selection,
        odds,
        fixture_id
      )
    `)
    .eq('user_id', userId)
    .order('id', { ascending: false });

  if (betsError) {
    throw new Error(`Failed to fetch user bet history: ${betsError.message}`);
  }

  return betsData as UserBet[] || [];
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
