-- Create function to safely decrease product quantity
create or replace function public.decrease_product_quantity(
  product_id_param integer,
  quantity_to_decrease numeric
)
returns json
language plpgsql
security definer
as $$
declare
  current_quantity numeric;
  new_quantity numeric;
begin
  -- Get current quantity
  select quantity into current_quantity
  from public.products
  where id = product_id_param
  for update;

  if current_quantity is null then
    return json_build_object('success', false, 'error', 'Product not found');
  end if;

  -- Calculate new quantity (don't go below 0)
  new_quantity := greatest(0, current_quantity - quantity_to_decrease);

  -- Update the quantity
  update public.products
  set quantity = new_quantity
  where id = product_id_param;

  return json_build_object(
    'success', true,
    'old_quantity', current_quantity,
    'new_quantity', new_quantity
  );
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.decrease_product_quantity(integer, numeric) to authenticated;
