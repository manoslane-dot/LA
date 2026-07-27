create table if not exists public.farmer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  contact_email text,
  contact_phone text,
  service_areas text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_farmer_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_farmer_profiles_updated_at on public.farmer_profiles;
create trigger trg_farmer_profiles_updated_at
before update on public.farmer_profiles
for each row
execute function public.set_farmer_profiles_updated_at();

alter table public.farmer_profiles enable row level security;

drop policy if exists "authenticated users can view farmer profiles" on public.farmer_profiles;
create policy "authenticated users can view farmer profiles"
  on public.farmer_profiles for select to authenticated
  using (true);

drop policy if exists "farmers upsert own profile" on public.farmer_profiles;
create policy "farmers upsert own profile"
  on public.farmer_profiles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "farmers update own profile" on public.farmer_profiles;
create policy "farmers update own profile"
  on public.farmer_profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
