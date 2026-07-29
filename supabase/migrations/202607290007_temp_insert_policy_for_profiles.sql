-- Temporary permissive policies to confirm whether RLS is the blocker for profile writes.
-- These are intentionally broad and should be tightened later if needed.

create policy if not exists "allow all inserts for farmer profiles"
  on public.farmer_profiles
  for insert
  to authenticated
  with check (true);

create policy if not exists "allow all updates for farmer profiles"
  on public.farmer_profiles
  for update
  to authenticated
  using (true)
  with check (true);

create policy if not exists "allow all inserts for consumer profiles"
  on public.consumer_profiles
  for insert
  to authenticated
  with check (true);

create policy if not exists "allow all updates for consumer profiles"
  on public.consumer_profiles
  for update
  to authenticated
  using (true)
  with check (true);
