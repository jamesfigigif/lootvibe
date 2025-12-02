DO $$
BEGIN
    -- Check if public.users.id is UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id' AND data_type = 'uuid'
    ) THEN
        RAISE EXCEPTION 'DIAGNOSTIC_ERROR: public.users.id is still UUID!';
    END IF;

    -- Check if public.users.id is TEXT
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id' AND data_type = 'text'
    ) THEN
        RAISE EXCEPTION 'DIAGNOSTIC_ERROR: public.users.id is NOT text! It is: %', (
            SELECT data_type FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id'
        );
    END IF;
END $$;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
