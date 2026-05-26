-- ============================================================
-- CUSTOMER CHECKOUT: Policies + Notification Trigger
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Customers can create their own customer records (per shop)
drop policy if exists "Users can create own customer records" on public.customers;
create policy "Users can create own customer records" on public.customers
  for insert with check (auth.uid() = user_id);

-- 2. Customers can place orders (linked to their customer record)
drop policy if exists "Customers can place orders" on public.orders;
create policy "Customers can place orders" on public.orders
  for insert with check (
    exists (
      select 1 from customers
      where customers.id = orders.customer_id
        and customers.user_id = auth.uid()
    )
  );

-- 3. Customers can view their own orders
drop policy if exists "Customers view own orders" on public.orders;
create policy "Customers view own orders" on public.orders
  for select using (
    exists (
      select 1 from customers
      where customers.id = orders.customer_id
        and customers.user_id = auth.uid()
    )
  );

-- 4. Customers can insert order items for their own orders
drop policy if exists "Customers insert order items" on public.order_items;
create policy "Customers insert order items" on public.order_items
  for insert with check (
    exists (
      select 1 from orders o
      join customers c on c.id = o.customer_id
      where o.id = order_items.order_id
        and c.user_id = auth.uid()
    )
  );

-- 5. Customers can view their own order items
drop policy if exists "Customers view own order items" on public.order_items;
create policy "Customers view own order items" on public.order_items
  for select using (
    exists (
      select 1 from orders o
      join customers c on c.id = o.customer_id
      where o.id = order_items.order_id
        and c.user_id = auth.uid()
    )
  );

-- 6. Trigger: automatically notify shop owner + employees when a new order is placed
create or replace function public.notify_new_order()
returns trigger as $$
declare
  v_owner_id uuid;
begin
  -- Get shop owner
  select owner_id into v_owner_id
  from public.shops
  where id = new.shop_id;

  -- Notify owner
  if v_owner_id is not null then
    insert into public.notifications (user_id, shop_id, title, message, type)
    values (
      v_owner_id,
      new.shop_id,
      'New Order Received 🛒',
      'Order ' || new.order_number || ' — TZS ' || to_char(new.total, 'FM999,999,999') || ' is waiting for processing.',
      'order'
    );
  end if;

  -- Notify active employees of that shop
  insert into public.notifications (user_id, shop_id, title, message, type)
  select
    e.user_id,
    new.shop_id,
    'New Customer Order',
    'Order ' || new.order_number || ' — TZS ' || to_char(new.total, 'FM999,999,999') || ' needs your attention.',
    'order'
  from public.employees e
  where e.shop_id = new.shop_id
    and e.is_active = true
    and e.user_id is distinct from v_owner_id;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_order_notify on public.orders;
create trigger on_new_order_notify
  after insert on public.orders
  for each row execute procedure public.notify_new_order();
