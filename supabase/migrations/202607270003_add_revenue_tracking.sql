-- Add revenue tracking to farmer profiles
alter table public.farmer_profiles
  add column if not exists total_revenue numeric(12, 2) default 0;

-- Create index for revenue queries
create index if not exists idx_farmer_profiles_revenue 
  on public.farmer_profiles(total_revenue);
