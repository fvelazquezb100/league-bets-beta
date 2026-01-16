import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const ensureUserProfile = async (user: User): Promise<boolean> => {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      return true; // Profile already exists
    }

    // Generate username from email or metadata
    let baseUsername = user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario';
    let username = baseUsername;
    
    // Check if username is taken and find available one
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const { data: isAvailable } = await supabase
        .rpc('check_username_availability', { username_to_check: username });

      // If username is available (function returns true when available)
      if (isAvailable) {
        break;
      }
      
      // Username is taken, try with suffix
      attempts++;
      const suffix = Math.floor(100 + Math.random() * 900); // 3-digit suffix
      username = `${baseUsername}_${suffix}`;
    }

    // Create profile
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: username,
        weekly_budget: 1000,
        total_points: 0,
        league_id: null,
        role: 'user',
        theme: 'light'
      });

    if (error) {
      console.error('Error creating profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
    return false;
  }
};