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

// Get developer mode status
const getDeveloperMode = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('betting_settings' as any)
      .select('*')
      .eq('setting_key', 'developer_mode')
      .maybeSingle();

    if (error) {
      console.error('Database error getting developer_mode:', error);
      return false;
    }

    if (!data) {
      return false;
    }

    return (data as any).setting_value === 'true';
  } catch (err) {
    console.error('Exception in getDeveloperMode:', err);
    return false;
  }
};

// Update developer mode in database
const updateDeveloperMode = async (enabled: boolean): Promise<BettingSettingsResponse> => {
  try {
    const { data, error } = await supabase
      .from('betting_settings' as any)
      .upsert({
        setting_key: 'developer_mode',
        setting_value: enabled.toString(),
        description: 'Developer mode to bypass time restrictions',
        updated_at: new Date().toISOString()
      } as any, { onConflict: 'setting_key' })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to update developer mode: ${error.message}`
      };
    }

    return {
      success: true,
      message: `Developer mode ${enabled ? 'enabled' : 'disabled'} successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to save developer mode'
    };
  }
};

// Get maintenance mode status
const getMaintenanceMode = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('betting_settings' as any)
      .select('*')
      .eq('setting_key', 'system_maintenance_active')
      .maybeSingle();

    if (error) {
      console.error('Database error getting maintenance_mode:', error);
      return false;
    }

    if (!data) {
      return false;
    }

    return (data as any).setting_value === 'true';
  } catch (err) {
    console.error('Exception in getMaintenanceMode:', err);
    return false;
  }
};

// Update maintenance mode in database
const updateMaintenanceMode = async (enabled: boolean): Promise<BettingSettingsResponse> => {
  try {
    const { data, error } = await supabase
      .from('betting_settings' as any)
      .upsert({
        setting_key: 'system_maintenance_active',
        setting_value: enabled.toString(),
        description: 'System Maintenance Active Flag',
        updated_at: new Date().toISOString()
      } as any, { onConflict: 'setting_key' })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to update maintenance mode: ${error.message}`
      };
    }

    return {
      success: true,
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to save maintenance mode'
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

  const {
    data: developerMode = false,
    isLoading: isLoadingDevMode,
  } = useQuery({
    queryKey: ['developer-mode'],
    queryFn: getDeveloperMode,
    staleTime: 0, // Always fresh for admin
  });

  const {
    data: maintenanceMode = false,
    isLoading: isLoadingMaintenance,
  } = useQuery({
    queryKey: ['maintenance-mode'],
    queryFn: getMaintenanceMode,
    // Short stale time for maintenance mode to ensure clients catch it relatively quickly
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Poll every minute
  });

  const updateCutoffTimeMutation = useMutation({
    mutationFn: updateBettingCutoffTime,
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ['betting-cutoff-minutes'] });
    },
  });

  const updateDeveloperModeMutation = useMutation({
    mutationFn: updateDeveloperMode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer-mode'] });
    },
  });

  const updateMaintenanceModeMutation = useMutation({
    mutationFn: updateMaintenanceMode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-mode'] });
    },
  });

  return {
    settings: [], // Empty array for now since we don't have the database table
    cutoffMinutes,
    developerMode,
    maintenanceMode,
    isLoading: isLoadingCutoff || isLoadingDevMode || isLoadingMaintenance,
    error: cutoffError,
    updateCutoffTime: updateCutoffTimeMutation.mutateAsync,
    updateDeveloperMode: updateDeveloperModeMutation.mutateAsync,
    updateMaintenanceMode: updateMaintenanceModeMutation.mutateAsync,
    isUpdating: updateCutoffTimeMutation.isPending || updateDeveloperModeMutation.isPending || updateMaintenanceModeMutation.isPending,
    updateError: updateCutoffTimeMutation.error || updateDeveloperModeMutation.error || updateMaintenanceModeMutation.error,
  };
};

