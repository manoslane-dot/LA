drop policy if exists "buyers create their purchase requests" on public.purchase_requests;
drop policy if exists "farmers update their purchase requests" on public.purchase_requests;

create policy "buyers create their purchase requests"
  on public.purchase_requests for insert to authenticated
  with check (
    auth.uid() = buyer_id
    and farmer_id = (select farmer_id from public.products where id = product_id)
  );

create policy "farmers update their purchase requests"
  on public.purchase_requests for update to authenticated
  using (auth.uid() = farmer_id)
  with check (auth.uid() = farmer_id);
