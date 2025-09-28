-- Add match availability control system for superadmin
-- This allows controlling which days have live betting enabled vs just showing upcoming matches
-- Date: 05 Sep 2025, 12:40:00

-- ============================================================================
-- PART 1: Create match_availability_control table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.match_availability_control (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  is_live_betting_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(date)
);

-- Add comment to document the purpose
COMMENT ON TABLE public.match_availability_control IS 'Controls which days have live betting enabled for all users';
COMMENT ON COLUMN public.match_availability_control.date IS 'The date for which betting availability is controlled';
COMMENT ON COLUMN public.match_availability_control.is_live_betting_enabled IS 'If true, shows live odds. If false, shows only match names without odds';

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_match_availability_control_date ON public.match_availability_control(date);
CREATE INDEX IF NOT EXISTS idx_match_availability_control_enabled ON public.match_availability_control(is_live_betting_enabled);

-- ============================================================================
-- PART 2: Create function to initialize availability for a date range
-- ============================================================================

CREATE OR REPLACE FUNCTION public.initialize_match_availability(
  start_date DATE,
  end_date DATE,
  default_enabled BOOLEAN DEFAULT false
)
RETURNS void AS $$
DECLARE
  current_date_var DATE;
BEGIN
  current_date_var := start_date;
  
  WHILE current_date_var <= end_date LOOP
    -- Insert or update the availability for this date
    INSERT INTO public.match_availability_control (date, is_live_betting_enabled)
    VALUES (current_date_var, default_enabled)
    ON CONFLICT (date) 
    DO UPDATE SET 
      is_live_betting_enabled = default_enabled,
      updated_at = now();
    
    current_date_var := current_date_var + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: Update reset_weekly_budgets function to include availability reset
-- ============================================================================

-- Drop the existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.reset_weekly_budgets();

CREATE OR REPLACE FUNCTION public.reset_weekly_budgets()
RETURNS jsonb AS $$
DECLARE
  v_current_date DATE;
  v_next_tuesday DATE;
  v_result jsonb;
  v_updated_leagues INTEGER := 0;
  v_updated_availability INTEGER := 0;
BEGIN
  -- Get current date
  v_current_date := CURRENT_DATE;
  
  -- Calculate next Tuesday (if today is Tuesday, use next Tuesday)
  v_next_tuesday := v_current_date + INTERVAL '1 week';
  -- Adjust to Tuesday (assuming Monday = 1, Tuesday = 2, etc.)
  WHILE EXTRACT(DOW FROM v_next_tuesday) != 2 LOOP
    v_next_tuesday := v_next_tuesday + INTERVAL '1 day';
  END LOOP;
  
  -- Reset budgets for all leagues with weekly reset
  UPDATE public.profiles
  SET weekly_budget = l.budget
  FROM public.leagues l
  WHERE profiles.league_id = l.id
    AND l.reset_budget = 'weekly';
  
  GET DIAGNOSTICS v_updated_leagues = ROW_COUNT;
  
  -- Reset match availability: enable from today until next Monday (day before next Tuesday)
  PERFORM public.initialize_match_availability(
    v_current_date,
    v_next_tuesday - INTERVAL '1 day',  -- Monday before next Tuesday
    true  -- Enable live betting for this period
  );
  
  -- Disable availability for dates after next Monday
  UPDATE public.match_availability_control
  SET is_live_betting_enabled = false,
      updated_at = now()
  WHERE date > (v_next_tuesday - INTERVAL '1 day');
  
  GET DIAGNOSTICS v_updated_availability = ROW_COUNT;
  
  -- Return success response
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Weekly budgets and match availability reset successfully',
    'updated_leagues', v_updated_leagues,
    'updated_availability_days', v_updated_availability,
    'reset_period', jsonb_build_object(
      'from', v_current_date,
      'to', v_next_tuesday - INTERVAL '1 day'
    ),
    'next_reset_date', v_next_tuesday
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 4: Create helper function to get availability status for a date
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_match_availability_status(check_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_enabled BOOLEAN;
BEGIN
  SELECT is_live_betting_enabled INTO v_is_enabled
  FROM public.match_availability_control
  WHERE date = check_date;
  
  -- If no record exists, default to false (no live betting)
  RETURN COALESCE(v_is_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: Create betting settings table for superadmin configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.betting_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comment to document the purpose
COMMENT ON TABLE public.betting_settings IS 'Stores configurable betting settings that can be modified by superadmin';
COMMENT ON COLUMN public.betting_settings.setting_key IS 'Unique identifier for the setting (e.g., betting_cutoff_minutes)';
COMMENT ON COLUMN public.betting_settings.setting_value IS 'The current value of the setting';
COMMENT ON COLUMN public.betting_settings.description IS 'Human-readable description of what this setting controls';

-- Create index for better performance (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_betting_settings_key ON public.betting_settings(setting_key);

-- ============================================================================
-- PART 6: Create functions for betting settings management
-- ============================================================================

-- Function to get all betting settings
CREATE OR REPLACE FUNCTION public.get_betting_settings()
RETURNS TABLE (
  setting_key VARCHAR(100),
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bs.setting_key,
    bs.setting_value,
    bs.description,
    bs.updated_at
  FROM public.betting_settings bs
  ORDER BY bs.setting_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get betting cutoff time in minutes
CREATE OR REPLACE FUNCTION public.get_betting_cutoff_minutes()
RETURNS INTEGER AS $$
DECLARE
  v_minutes INTEGER;
BEGIN
  SELECT setting_value::INTEGER INTO v_minutes
  FROM public.betting_settings
  WHERE setting_key = 'betting_cutoff_minutes';
  
  -- If no setting exists, return default of 15 minutes
  RETURN COALESCE(v_minutes, 15);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update betting cutoff time
CREATE OR REPLACE FUNCTION public.update_betting_cutoff_minutes(new_minutes INTEGER)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Validate input
  IF new_minutes < 1 OR new_minutes > 120 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid cutoff time. Must be between 1 and 120 minutes.'
    );
  END IF;
  
  -- Insert or update the setting
  INSERT INTO public.betting_settings (setting_key, setting_value, description)
  VALUES ('betting_cutoff_minutes', new_minutes::TEXT, 'Minimum minutes before match start when betting is allowed')
  ON CONFLICT (setting_key)
  DO UPDATE SET 
    setting_value = new_minutes::TEXT,
    updated_at = now();
  
  -- Return success response
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Betting cutoff time updated successfully',
    'new_cutoff_minutes', new_minutes
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 7: Initialize default betting settings
-- ============================================================================

-- Insert default betting cutoff time (15 minutes)
INSERT INTO public.betting_settings (setting_key, setting_value, description)
VALUES ('betting_cutoff_minutes', '15', 'Minimum minutes before match start when betting is allowed')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- PART 8: Initialize availability for the next 15 days (today + 14 days)
-- ============================================================================

-- Clean up any potential duplicate data first
DELETE FROM public.match_availability_control 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM public.match_availability_control 
  GROUP BY date
);

-- Initialize with default values (disabled) for the next 15 days
SELECT public.initialize_match_availability(
  CURRENT_DATE,
  (CURRENT_DATE + INTERVAL '14 days')::DATE,
  false  -- Default to disabled
);


