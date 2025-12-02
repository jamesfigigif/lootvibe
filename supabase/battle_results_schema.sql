-- Create a table to store battle results for verification
create table if not exists public.battle_results (
  id uuid default gen_random_uuid() primary key,
  battle_id text not null,
  winner_id text not null,
  total_value numeric not null,
  items jsonb,
  claimed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.battle_results enable row level security;

-- Allow service role (Edge Functions) full access
create policy "Service role has full access"
  on public.battle_results
  for all
  using ( auth.role() = 'service_role' );

-- Allow users to read their own results (optional, for history)
create policy "Users can read their own results"
  on public.battle_results
  for select
  using ( auth.uid()::text = winner_id );
