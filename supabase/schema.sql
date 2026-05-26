-- ============================================
-- HERUFI BUSINESS PLATFORM - SUPABASE SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('owner', 'employee', 'customer', 'admin')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Allow all authenticated users to search profiles (required for employee assignment)
create policy "Authenticated users can view profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Profiles are updateable by owner" on public.profiles
  for update using (auth.uid() = id);

create policy "Profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

-- Trigger: auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, profiles.full_name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- SHOPS
-- ============================================
create table if not exists public.shops (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  logo_url text,
  location text not null,
  contact_phone text,
  contact_email text,
  business_category text default 'Retail',
  currency text default 'TZS',
  tax_rate numeric default 18,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.shops enable row level security;

-- Public: anyone can view active shops (for product catalog & shop pages)
create policy "Active shops viewable by anyone" on public.shops
  for select using (is_active = true);

create policy "Owners can manage their shops" on public.shops
  for all using (auth.uid() = owner_id);

-- ============================================
-- EMPLOYEES
-- ============================================
create table if not exists public.employees (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  shop_id uuid references public.shops(id) on delete cascade,
  role text not null default 'cashier' check (role in ('cashier', 'manager', 'stock_manager', 'delivery_manager', 'sales_agent')),
  permissions text[] default '{}',
  is_active boolean default true,
  hired_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.employees enable row level security;

create policy "Shop owners can manage employees" on public.employees
  for all using (
    exists (select 1 from shops where shops.id = employees.shop_id and shops.owner_id = auth.uid())
    or auth.uid() = user_id
  );

-- ============================================
-- CATEGORIES
-- ============================================
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  name text not null,
  parent_id uuid references public.categories(id),
  description text,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Categories viewable by authenticated" on public.categories
  for select using (auth.role() = 'authenticated');

create policy "Shop owners manage categories" on public.categories
  for all using (
    exists (select 1 from shops where shops.id = categories.shop_id and shops.owner_id = auth.uid())
  );

-- ============================================
-- SUPPLIERS
-- ============================================
create table if not exists public.suppliers (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  name text not null,
  contact_phone text,
  contact_email text,
  address text,
  debt_amount numeric default 0,
  created_at timestamptz default now()
);

alter table public.suppliers enable row level security;

create policy "Shop owners manage suppliers" on public.suppliers
  for all using (
    exists (select 1 from shops where shops.id = suppliers.shop_id and shops.owner_id = auth.uid())
  );

-- ============================================
-- PRODUCTS
-- ============================================
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  category_id uuid references public.categories(id),
  supplier_id uuid references public.suppliers(id),
  name text not null,
  description text,
  sku text not null,
  barcode text,
  cost_price numeric not null default 0,
  selling_price numeric not null,
  quantity integer not null default 0,
  low_stock_threshold integer default 10,
  unit text default 'pcs',
  expiry_date date,
  batch_number text,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

-- Public catalog: any visitor (including anonymous) can view active products
create policy "Active products viewable by anyone" on public.products
  for select using (is_active = true);

create policy "Shop owners manage products" on public.products
  for all
  using (
    exists (select 1 from shops where shops.id = products.shop_id and shops.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from shops where shops.id = products.shop_id and shops.owner_id = auth.uid())
  );

-- ============================================
-- PRODUCT VARIATIONS
-- ============================================
create table if not exists public.product_variations (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade,
  size text,
  color text,
  weight text,
  packaging text,
  price_adjustment numeric default 0,
  quantity integer default 0,
  sku text not null,
  created_at timestamptz default now()
);

-- ============================================
-- INVENTORY LOGS
-- ============================================
create table if not exists public.inventory_logs (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete cascade,
  type text not null check (type in ('purchase', 'sale', 'transfer', 'adjustment', 'damaged', 'lost', 'return')),
  quantity_change integer not null,
  quantity_before integer not null,
  quantity_after integer not null,
  notes text,
  user_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.inventory_logs enable row level security;

create policy "Shop owners view inventory logs" on public.inventory_logs
  for all using (
    exists (select 1 from shops where shops.id = inventory_logs.shop_id and shops.owner_id = auth.uid())
  );

-- ============================================
-- CUSTOMERS
-- ============================================
create table if not exists public.customers (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  user_id uuid references public.profiles(id),
  name text not null,
  phone text,
  email text,
  address text,
  loyalty_points integer default 0,
  credit_limit numeric default 0,
  outstanding_credit numeric default 0,
  segment text default 'new' check (segment in ('vip', 'regular', 'occasional', 'new')),
  created_at timestamptz default now()
);

alter table public.customers enable row level security;

create policy "Shop owners manage customers" on public.customers
  for all using (
    exists (select 1 from shops where shops.id = customers.shop_id and shops.owner_id = auth.uid())
    or auth.uid() = user_id
  );

-- ============================================
-- ORDERS
-- ============================================
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id),
  employee_id uuid references public.employees(id),
  order_number text not null unique,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  payment_method text default 'cash' check (payment_method in ('cash', 'mpesa', 'card', 'credit', 'bank_transfer')),
  payment_status text default 'unpaid' check (payment_status in ('paid', 'unpaid', 'partial')),
  subtotal numeric not null default 0,
  discount numeric default 0,
  tax numeric default 0,
  total numeric not null default 0,
  notes text,
  delivery_address text,
  delivery_status text check (delivery_status in ('pending', 'in_transit', 'delivered', 'returned')),
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Shop owners manage orders" on public.orders
  for all using (
    exists (select 1 from shops where shops.id = orders.shop_id and shops.owner_id = auth.uid())
    or auth.uid() = (select user_id from employees where id = orders.employee_id)
  );

create policy "Customers view own orders" on public.orders
  for select using (
    exists (select 1 from customers where customers.id = orders.customer_id and customers.user_id = auth.uid())
  );

-- ============================================
-- ORDER ITEMS
-- ============================================
create table if not exists public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity integer not null,
  unit_price numeric not null,
  discount numeric default 0,
  total numeric not null,
  created_at timestamptz default now()
);

alter table public.order_items enable row level security;

create policy "Order items viewable with order access" on public.order_items
  for all using (
    exists (
      select 1 from orders o
      join shops s on s.id = o.shop_id
      where o.id = order_items.order_id and s.owner_id = auth.uid()
    )
  );

-- ============================================
-- TRANSACTIONS
-- ============================================
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  order_id uuid references public.orders(id),
  type text not null check (type in ('income', 'expense', 'transfer')),
  category text not null,
  amount numeric not null,
  description text not null,
  payment_method text default 'cash',
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;

create policy "Shop owners manage transactions" on public.transactions
  for all using (
    exists (select 1 from shops where shops.id = transactions.shop_id and shops.owner_id = auth.uid())
  );

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  shop_id uuid references public.shops(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'system' check (type in ('low_stock', 'expiry', 'order', 'payment', 'employee', 'system')),
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users view own notifications" on public.notifications
  for all using (auth.uid() = user_id);

-- ============================================
-- STOCK TRANSFERS
-- ============================================
create table if not exists public.stock_transfers (
  id uuid default uuid_generate_v4() primary key,
  from_shop_id uuid references public.shops(id) on delete cascade,
  to_shop_id uuid references public.shops(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity integer not null,
  status text default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz default now()
);

-- ============================================
-- USEFUL INDEXES
-- ============================================
create index if not exists idx_products_shop_id on public.products(shop_id);
create index if not exists idx_orders_shop_id on public.orders(shop_id);
create index if not exists idx_orders_created_at on public.orders(created_at);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id, is_read);
create index if not exists idx_customers_shop_id on public.customers(shop_id);
create index if not exists idx_employees_shop_id on public.employees(shop_id);
create index if not exists idx_transactions_shop_id on public.transactions(shop_id);

-- ============================================
-- AI CHAT SESSIONS
-- ============================================
create table if not exists public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mode text not null check (mode in ('owner', 'customer')),
  title text not null default 'New Chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.chat_sessions enable row level security;

create policy "Users manage own chat sessions" on public.chat_sessions
  for all using (auth.uid() = user_id);

-- ============================================
-- AI CHAT MESSAGES
-- ============================================
create table if not exists public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;

create policy "Users manage messages in own sessions" on public.chat_messages
  for all using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
      and chat_sessions.user_id = auth.uid()
    )
  );

create index if not exists idx_chat_sessions_user_id on public.chat_sessions(user_id, updated_at desc);
create index if not exists idx_chat_messages_session_id on public.chat_messages(session_id, created_at asc);

-- ============================================
-- STORAGE: product-images bucket
-- ============================================
-- Run this in Supabase Dashboard > Storage, or via SQL:
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict do nothing;
--
-- Storage policies (run in SQL editor):
-- create policy "Authenticated users can upload product images" on storage.objects
--   for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
-- create policy "Product images are publicly readable" on storage.objects
--   for select using (bucket_id = 'product-images');
-- create policy "Owners can delete their product images" on storage.objects
--   for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- You can run this after setup to populate sample data
-- See supabase/seed.sql for sample data
