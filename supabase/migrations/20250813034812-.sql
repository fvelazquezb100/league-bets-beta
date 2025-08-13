-- Update the update_username RPC function to use 15 character limit
CREATE OR REPLACE FUNCTION public.update_username(new_username text)
RETURNS public.username_update_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid;
  username_exists boolean;
  result public.username_update_result;
BEGIN
  -- Check if user is authenticated
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    result.success := false;
    result.message := 'User not authenticated';
    RETURN result;
  END IF;

  -- Validate username (basic checks)
  IF new_username IS NULL OR trim(new_username) = '' THEN
    result.success := false;
    result.message := 'Username cannot be empty';
    RETURN result;
  END IF;

  -- Check username length (updated limits)
  IF length(trim(new_username)) < 3 THEN
    result.success := false;
    result.message := 'Username must be at least 3 characters long';
    RETURN result;
  END IF;

  IF length(trim(new_username)) > 15 THEN
    result.success := false;
    result.message := 'Username must be 15 characters or less';
    RETURN result;
  END IF;

  -- Check if username already exists (case-insensitive)
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE lower(username) = lower(trim(new_username))
      AND id != current_user_id
  ) INTO username_exists;

  IF username_exists THEN
    result.success := false;
    result.message := 'Username is already taken';
    RETURN result;
  END IF;

  -- Update the username
  UPDATE public.profiles
  SET username = trim(new_username)
  WHERE id = current_user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    result.success := false;
    result.message := 'User profile not found';
    RETURN result;
  END IF;

  result.success := true;
  result.message := 'Username updated successfully';
  RETURN result;
END;
$$;