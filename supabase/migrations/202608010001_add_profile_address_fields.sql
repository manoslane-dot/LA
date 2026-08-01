alter table public.consumer_profiles
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists postal_code text;

alter table public.farmer_profiles
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists postal_code text;
