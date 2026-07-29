-- Ensure farmer and consumer profile images use the same upload rules
-- and can be stored in the shared avatars bucket.

alter table public.farmer_profiles enable row level security;
alter table public.consumer_profiles enable row level security;

-- Farmer profiles: allow authenticated users to read all profiles, but only manage their own row.
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

-- Consumer profiles: allow authenticated users to read all profiles, but only manage their own row.
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

-- Storage policies for the shared avatars bucket.
do $$
begin
  if to_regnamespace('storage') is not null and to_regclass('storage.objects') is not null then
    drop policy if exists "authenticated users can view avatars" on storage.objects;
    create policy "authenticated users can view avatars"
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'avatars');

    drop policy if exists "authenticated users can upload their own avatars" on storage.objects;
    create policy "authenticated users can upload their own avatars"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );

    drop policy if exists "authenticated users can update their own avatars" on storage.objects;
    create policy "authenticated users can update their own avatars"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );

    drop policy if exists "authenticated users can delete their own avatars" on storage.objects;
    create policy "authenticated users can delete their own avatars"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
