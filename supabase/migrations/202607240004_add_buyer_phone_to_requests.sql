alter table public.purchase_requests
  add column if not exists buyer_phone text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'purchase_requests_buyer_phone_length_check'
  ) then
    alter table public.purchase_requests
      add constraint purchase_requests_buyer_phone_length_check
      check (
        buyer_phone is null
        or char_length(regexp_replace(buyer_phone, '\\s', '', 'g')) between 7 and 20
      );
  end if;
end
$$;
