select
  tablename,
  policyname,
  qual,
  cmd
from
  pg_policies
where
  tablename = 'users';
