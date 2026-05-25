export type UserRole = "owner" | "employee" | "customer" | "admin";

export type EmployeeRole = "cashier" | "manager" | "stock_manager" | "delivery_manager" | "sales_agent";

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  logo_url?: string;
  location: string;
  contact_phone?: string;
  contact_email?: string;
  business_category: string;
  currency: string;
  tax_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  shop_id: string;
  role: EmployeeRole;
  permissions: string[];
  is_active: boolean;
  hired_at: string;
  user?: User;
  shop?: Shop;
}

export interface Category {
  id: string;
  shop_id: string;
  name: string;
  parent_id?: string;
  description?: string;
}

export interface Supplier {
  id: string;
  shop_id: string;
  name: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  debt_amount: number;
}

export interface Product {
  id: string;
  shop_id: string;
  category_id?: string;
  supplier_id?: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
  unit: string;
  expiry_date?: string;
  image_url?: string;
  variations?: ProductVariation[];
  batch_number?: string;
  is_active: boolean;
  created_at: string;
  category?: Category;
  supplier?: Supplier;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  size?: string;
  color?: string;
  weight?: string;
  packaging?: string;
  price_adjustment: number;
  quantity: number;
  sku: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  shop_id: string;
  type: "purchase" | "sale" | "transfer" | "adjustment" | "damaged" | "lost" | "return";
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  notes?: string;
  user_id: string;
  created_at: string;
  product?: Product;
}

export interface Customer {
  id: string;
  shop_id: string;
  user_id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  loyalty_points: number;
  credit_limit: number;
  outstanding_credit: number;
  segment?: "vip" | "regular" | "occasional" | "new";
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  product?: Product;
}

export interface Order {
  id: string;
  shop_id: string;
  customer_id?: string;
  employee_id?: string;
  order_number: string;
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  payment_method: "cash" | "mpesa" | "card" | "credit" | "bank_transfer";
  payment_status: "paid" | "unpaid" | "partial";
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  delivery_address?: string;
  delivery_status?: "pending" | "in_transit" | "delivered" | "returned";
  items?: OrderItem[];
  customer?: Customer;
  created_at: string;
}

export interface Transaction {
  id: string;
  shop_id: string;
  order_id?: string;
  type: "income" | "expense" | "transfer";
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  date: string;
  created_at: string;
}

export interface Expense {
  id: string;
  shop_id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  shop_id?: string;
  title: string;
  message: string;
  type: "low_stock" | "expiry" | "order" | "payment" | "employee" | "system";
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  low_stock_count: number;
  expiring_soon_count: number;
  revenue_growth: number;
  orders_growth: number;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  total_sold: number;
  revenue: number;
}

export interface StockTransfer {
  id: string;
  from_shop_id: string;
  to_shop_id: string;
  product_id: string;
  quantity: number;
  status: "pending" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
}
