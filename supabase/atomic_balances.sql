-- Function to atomically increment user balance
create or replace function increment_balance(user_id uuid, amount numeric)
returns void
language plpgsql
security definer
as $$
begin
  update users
  set balance = balance + amount
  where id = user_id;
end;
$$;

-- Function to atomically decrement user balance
create or replace function decrement_balance(user_id uuid, amount numeric)
returns void
language plpgsql
security definer
as $$
declare
  current_balance numeric;
begin
  -- Lock the row for update
  select balance into current_balance
  from users
  where id = user_id
  for update;

  if current_balance < amount then
    raise exception 'Insufficient funds';
  end if;

  update users
  set balance = balance - amount
  where id = user_id;
end;
$$;
