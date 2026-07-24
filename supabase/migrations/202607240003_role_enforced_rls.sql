alter table public.products enable row level security;

drop policy if exists "authenticated users can view products" on public.products;
drop policy if exists "farmers manage their own products" on public.products;
drop policy if exists "farmers insert own products" on public.products;
drop policy if exists "farmers update own products" on public.products;
drop policy if exists "farmers delete own products" on public.products;

create policy "authenticated users can view products"
  on public.products for select to authenticated
  using (true);

create policy "farmers insert own products"
  on public.products for insert to authenticated
  with check (
    auth.uid() = farmer_id
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'farmer'
  );

create policy "farmers update own products"
  on public.products for update to authenticated
  using (
    auth.uid() = farmer_id
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'farmer'
  )
  with check (
    auth.uid() = farmer_id
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'farmer'
  );

create policy "farmers delete own products"
  on public.products for delete to authenticated
  using (
    auth.uid() = farmer_id
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'farmer'
  );

drop policy if exists "buyers create their purchase requests" on public.purchase_requests;
drop policy if exists "farmers update their purchase requests" on public.purchase_requests;

create policy "buyers create their purchase requests"
  on public.purchase_requests for insert to authenticated
  with check (
    auth.uid() = buyer_id
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'consumer'
    and farmer_id = (select farmer_id from public.products where id = product_id)
  );

create policy "farmers update their purchase requests"
  on public.purchase_requests for update to authenticated
  using (
    auth.uid() = farmer_id
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'farmer'
  )
  with check (
    auth.uid() = farmer_id
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'farmer'
  );
