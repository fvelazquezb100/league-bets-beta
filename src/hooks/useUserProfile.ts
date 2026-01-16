import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for user profile
export interface UserProfile {
  id: string;
  username: string;
  weekly_budget: number;
  total_points: number;
  league_id: number | null;
  role: string;
  global_role?: string;
  theme?: 'light' | 'dark';
}

// Fetch user profile
const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, weekly_budget, total_points, league_id, role, global_role, theme')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  return profile as UserProfile;
};

// Update username function
const updateUsername = async ({ userId, newUsername }: { userId: string; newUsername: string }) => {
  const { data, error } = await supabase.rpc('update_username', {
    new_username: newUsername
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data && typeof data === 'object' && 'success' in data) {
    const result = data as { success: boolean; message: string };
    if (!result.success) {
      throw new Error(result.message);
    }
  }

  return data;
};

// Custom hook for user profile
export const useUserProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - profile data doesn't change often
    retry: 2,
  });
};

// Mutation for updating username
export const useUpdateUsername = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateUsername,
    onSuccess: (_, variables) => {
      // Invalidate user profile to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['user-profile', variables.userId] });
    },
  });
};
