alter table public.purchase_requests
  add column if not exists unit_at_request text,
  add column if not exists unit_price_at_request numeric(12, 2);

update public.purchase_requests pr
set
  unit_at_request = p.unit,
  unit_price_at_request = p.price
from public.products p
where pr.product_id = p.id
  and (pr.unit_at_request is null or pr.unit_price_at_request is null);

alter table public.purchase_requests
  alter column unit_at_request set not null,
  alter column unit_price_at_request set not null;
