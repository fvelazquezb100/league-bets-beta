import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if a user has made donations
 * Returns the total donation amount and whether the user has donated
 */
export function useUserDonations(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-donations', userId],
    queryFn: async () => {
      if (!userId) {
        return { hasDonated: false, totalAmount: 0 };
      }

      const { data, error } = await supabase.rpc('get_user_total_donations', {
        user_uuid: userId,
      });

      if (error) {
        console.error('Error fetching user donations:', error);
        return { hasDonated: false, totalAmount: 0 };
      }

      const totalAmount = Number(data || 0);
      return {
        hasDonated: totalAmount > 0,
        totalAmount,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to check if multiple users have donated (for classification table)
 * Returns a map of user_id -> hasDonated
 */
export function useUsersDonationStatus(userIds: string[]) {
  return useQuery({
    queryKey: ['users-donation-status', userIds.sort().join(',')],
    queryFn: async () => {
      if (userIds.length === 0) {
        return new Map<string, boolean>();
      }

      const { data, error } = await supabase
        .from('payments')
        .select('user_id')
        .in('user_id', userIds)
        .eq('payment_type', 'donation')
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching users donation status:', error);
        return new Map<string, boolean>();
      }

      const donationMap = new Map<string, boolean>();
      userIds.forEach((id) => {
        donationMap.set(id, false);
      });

      data?.forEach((payment) => {
        if (payment.user_id) {
          donationMap.set(payment.user_id, true);
        }
      });

      return donationMap;
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

