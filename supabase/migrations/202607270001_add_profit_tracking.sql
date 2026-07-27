-- Add profit tracking to purchase_requests
alter table public.purchase_requests
  add column if not exists profit numeric(12, 2) default 0;

-- Add comment for clarity
comment on column public.purchase_requests.profit is 'The total profit earned when this request is completed (requested_quantity * unit_price_at_request)';
