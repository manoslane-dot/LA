alter table public.farmer_profiles enable row level security;
alter table public.consumer_profiles enable row level security;

-- Farmer profiles: allow authenticated users to read all profiles, but only insert/update their own row.
drop policy if exists "authenticated users can view farmer profiles" on public.farmer_profiles;
create policy "authenticated users can view farmer profiles"
  on public.farmer_profiles for select to authenticated
  using (true);

drop policy if exists "users can insert own farmer profile" on public.farmer_profiles;
create policy "users can insert own farmer profile"
  on public.farmer_profiles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can update own farmer profile" on public.farmer_profiles;
create policy "users can update own farmer profile"
  on public.farmer_profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Consumer profiles: allow authenticated users to read all profiles, but only insert/update their own row.
drop policy if exists "authenticated users can view consumer profiles" on public.consumer_profiles;
create policy "authenticated users can view consumer profiles"
  on public.consumer_profiles for select to authenticated
  using (true);

drop policy if exists "users can insert own consumer profile" on public.consumer_profiles;
create policy "users can insert own consumer profile"
  on public.consumer_profiles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can update own consumer profile" on public.consumer_profiles;
create policy "users can update own consumer profile"
  on public.consumer_profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
