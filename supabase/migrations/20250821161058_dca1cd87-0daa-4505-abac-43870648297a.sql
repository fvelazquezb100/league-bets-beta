-- Add missing columns to leagues table if they don't exist
DO $$ 
BEGIN
  -- Add week column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leagues' AND column_name = 'week') THEN
    ALTER TABLE leagues ADD COLUMN week integer NOT NULL DEFAULT 1;
  END IF;
  
  -- Add type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leagues' AND column_name = 'type') THEN
    -- Create enum if it doesn't exist
    DO $inner$
    BEGIN
      CREATE TYPE league_type AS ENUM ('free', 'premium');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $inner$;
    
    ALTER TABLE leagues ADD COLUMN type league_type NOT NULL DEFAULT 'free'::league_type;
  END IF;
END $$;