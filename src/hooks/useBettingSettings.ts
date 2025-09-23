import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BettingSetting {
  setting_key: string;
  setting_value: string;
  description: string;
  updated_at: string;
}

export interface BettingSettingsResponse {
  success: boolean;
  message?: string;
  error?: string;
  new_cutoff_minutes?: number;
}

// Fetch all betting settings
const fetchBettingSettings = async (): Promise<BettingSetting[]> => {
  const { data, error } = await supabase.rpc('get_betting_settings');
  
  if (error) {
    throw new Error(`Error fetching betting settings: ${error.message}`);
  }
  
  return data || [];
};

// Update betting cutoff time
const updateBettingCutoffTime = async (minutes: number): Promise<BettingSettingsResponse> => {
  const { data, error } = await supabase.rpc('update_betting_cutoff_minutes', {
    new_minutes: minutes
  });
  
  if (error) {
    throw new Error(`Error updating betting cutoff time: ${error.message}`);
  }
  
  return data;
};

// Get current betting cutoff time in minutes
const getBettingCutoffMinutes = async (): Promise<number> => {
  const { data, error } = await supabase.rpc('get_betting_cutoff_minutes');
  
  if (error) {
    throw new Error(`Error getting betting cutoff time: ${error.message}`);
  }
  
  return data || 15; // Default to 15 minutes
};

export const useBettingSettings = () => {
  const queryClient = useQueryClient();

  const {
    data: settings = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['betting-settings'],
    queryFn: fetchBettingSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: cutoffMinutes = 15,
    isLoading: isLoadingCutoff,
    error: cutoffError
  } = useQuery({
    queryKey: ['betting-cutoff-minutes'],
    queryFn: getBettingCutoffMinutes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateCutoffTimeMutation = useMutation({
    mutationFn: updateBettingCutoffTime,
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ['betting-settings'] });
      queryClient.invalidateQueries({ queryKey: ['betting-cutoff-minutes'] });
    },
  });

  return {
    settings,
    cutoffMinutes,
    isLoading: isLoading || isLoadingCutoff,
    error: error || cutoffError,
    updateCutoffTime: updateCutoffTimeMutation.mutateAsync,
    isUpdating: updateCutoffTimeMutation.isPending,
    updateError: updateCutoffTimeMutation.error,
  };
};

