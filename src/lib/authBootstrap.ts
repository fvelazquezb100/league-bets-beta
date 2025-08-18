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
    let username = user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario';
    
    // Check if username is taken
    const { data: usernameExists } = await supabase
      .rpc('check_username_availability', { username_to_check: username });

    // If username exists, append random number
    if (usernameExists) {
      username = `${username}${Math.floor(Math.random() * 1000)}`;
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
        role: 'user'
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