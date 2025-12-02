DROP FUNCTION IF EXISTS decrement_balance(uuid, numeric);
CREATE OR REPLACE FUNCTION decrement_balance(user_id TEXT, amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance numeric;
BEGIN
  -- Lock the row for update
  SELECT balance INTO current_balance
  FROM users
  WHERE id = user_id
  FOR UPDATE;

  IF current_balance < amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  UPDATE users
  SET balance = balance - amount
  WHERE id = user_id;
END;
$$;
