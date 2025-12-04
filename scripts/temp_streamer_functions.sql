
-- Set user as streamer
CREATE OR REPLACE FUNCTION set_user_as_streamer(
    target_user_id TEXT,
    admin_user_id TEXT,
    odds_multiplier DECIMAL DEFAULT 2.00,
    allow_withdrawals BOOLEAN DEFAULT FALSE,
    admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    UPDATE public.users
    SET
        is_streamer = TRUE,
        can_withdraw = allow_withdrawals,
        streamer_odds_multiplier = odds_multiplier,
        streamer_note = admin_note
    WHERE id = target_user_id;

    INSERT INTO public.streamer_activity_log (user_id, action, admin_id, new_value, note)
    VALUES (
        target_user_id,
        'MADE_STREAMER',
        admin_user_id,
        json_build_object(
            'odds_multiplier', odds_multiplier,
            'can_withdraw', allow_withdrawals
        )::text,
        admin_note
    );

    result := json_build_object('success', true, 'message', 'User successfully set as streamer');
    RETURN result;
END;
$$;

-- Remove streamer status
CREATE OR REPLACE FUNCTION remove_streamer_status(
    target_user_id TEXT,
    admin_user_id TEXT,
    admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    UPDATE public.users
    SET
        is_streamer = FALSE,
        can_withdraw = TRUE,
        streamer_odds_multiplier = 1.00,
        streamer_note = NULL
    WHERE id = target_user_id;

    INSERT INTO public.streamer_activity_log (user_id, action, admin_id, note)
    VALUES (target_user_id, 'REMOVED_STREAMER', admin_user_id, admin_note);

    result := json_build_object('success', true, 'message', 'Streamer status removed');
    RETURN result;
END;
$$;

-- Edit streamer balance
CREATE OR REPLACE FUNCTION edit_streamer_balance(
    target_user_id TEXT,
    admin_user_id TEXT,
    new_balance DECIMAL,
    admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_balance DECIMAL;
    result JSON;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    SELECT balance INTO old_balance FROM public.users WHERE id = target_user_id;

    UPDATE public.users
    SET balance = new_balance
    WHERE id = target_user_id;

    INSERT INTO public.streamer_activity_log (user_id, action, admin_id, old_value, new_value, note)
    VALUES (
        target_user_id,
        'BALANCE_EDITED',
        admin_user_id,
        old_balance::text,
        new_balance::text,
        admin_note
    );

    result := json_build_object(
        'success', true,
        'message', 'Balance updated successfully',
        'old_balance', old_balance,
        'new_balance', new_balance
    );
    RETURN result;
END;
$$;

-- Toggle withdrawal permission
CREATE OR REPLACE FUNCTION toggle_user_withdrawal(
    target_user_id TEXT,
    admin_user_id TEXT,
    allow_withdraw BOOLEAN,
    admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    UPDATE public.users
    SET can_withdraw = allow_withdraw
    WHERE id = target_user_id;

    INSERT INTO public.streamer_activity_log (user_id, action, admin_id, new_value, note)
    VALUES (
        target_user_id,
        CASE WHEN allow_withdraw THEN 'WITHDRAWAL_ENABLED' ELSE 'WITHDRAWAL_DISABLED' END,
        admin_user_id,
        allow_withdraw::text,
        admin_note
    );

    result := json_build_object(
        'success', true,
        'message', CASE WHEN allow_withdraw THEN 'Withdrawals enabled' ELSE 'Withdrawals disabled' END
    );
    RETURN result;
END;
$$;
