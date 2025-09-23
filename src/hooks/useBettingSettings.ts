import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BettingSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface BettingSettingsResponse {
  success: boolean;
  message?: string;
  error?: string;
  new_cutoff_minutes?: number;
}

// Get current betting cutoff time in minutes from database
const getBettingCutoffMinutes = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('betting_settings' as any)
      .select('*')
      .eq('setting_key', 'betting_cutoff_minutes')
      .single();

    if (error) {
      console.error('Database error:', error);
      return 15; // Default to 15 minutes
    }

    if (!data) {
      console.warn('No data found for betting_cutoff_minutes');
      return 15; // Default to 15 minutes
    }

    const minutes = parseInt((data as any).setting_value, 10) || 15;
    return minutes;
  } catch (err) {
    console.error('Exception in getBettingCutoffMinutes:', err);
    return 15; // Default to 15 minutes
  }
};

// Update betting cutoff time in database
const updateBettingCutoffTime = async (minutes: number): Promise<BettingSettingsResponse> => {
  try {
    const { data, error } = await supabase
      .from('betting_settings' as any)
      .update({ 
        setting_value: minutes.toString(),
        updated_at: new Date().toISOString()
      } as any)
      .eq('setting_key', 'betting_cutoff_minutes')
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to update cutoff time: ${error.message}`
      };
    }

    return {
      success: true,
      message: 'Cutoff time updated successfully',
      new_cutoff_minutes: minutes
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to save cutoff time'
    };
  }
};

export const useBettingSettings = () => {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['betting-cutoff-minutes'] });
    },
  });

  return {
    settings: [], // Empty array for now since we don't have the database table
    cutoffMinutes,
    isLoading: isLoadingCutoff,
    error: cutoffError,
    updateCutoffTime: updateCutoffTimeMutation.mutateAsync,
    isUpdating: updateCutoffTimeMutation.isPending,
    updateError: updateCutoffTimeMutation.error,
  };
};

