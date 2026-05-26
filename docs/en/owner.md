# Owner Guide

As a **Shop Owner**, you have full access to every feature in Herufi. This guide walks through everything from creating your first shop to generating financial reports.

---

## Table of Contents

1. [Creating a Shop](#1-creating-a-shop)
2. [Managing Inventory](#2-managing-inventory)
3. [Point of Sale (POS)](#3-point-of-sale-pos)
4. [Managing Orders](#4-managing-orders)
5. [Managing Employees](#5-managing-employees)
6. [Customer Management](#6-customer-management)
7. [Analytics](#7-analytics)
8. [Financial Tracking](#8-financial-tracking)
9. [Reports & Exports](#9-reports--exports)
10. [AI Assistant](#10-ai-assistant)
11. [Settings](#11-settings)
12. [Multi-Shop Management](#12-multi-shop-management)

---

## 1. Creating a Shop

1. Go to **My Shops** in the sidebar.
2. Click **Add Shop**.
3. Fill in the details:

| Field | Required | Notes |
|---|---|---|
| Shop Name | Yes | Public name of your business |
| Location | Yes | City or address |
| Business Category | Yes | e.g. Wholesale, Retail, Restaurant |
| Currency | Yes | Default: TZS |
| Tax Rate | No | Percentage applied at checkout |
| Logo | No | Upload your shop's logo image |
| Contact Info | No | Phone, email, website |

4. Click **Create Shop**. Your shop is now live and selected in the sidebar.

> **Tip:** You can create multiple shops and switch between them using the shop selector at the top of the sidebar.

---

## 2. Managing Inventory

### Adding a Product

1. Go to **Inventory** → click **Add Product**.
2. Fill in the product form:

| Field | Notes |
|---|---|
| Name | Product display name |
| SKU | Auto-generated or enter manually |
| Category | Select or create a category |
| Cost Price | What you paid per unit |
| Selling Price | What customers pay |
| Quantity | Current stock count |
| Unit | e.g. kg, pieces, litres, box |
| Low Stock Alert | Alert threshold (e.g. 5 units) |
| Expiry Date | For perishables — triggers expiry alerts |
| Description | Optional product details |
| Image | Upload product photo |

3. Click **Save Product**.

### Stock Management

- **Low Stock Alerts:** When quantity falls at or below the threshold, a notification is sent and the product appears in the dashboard alert panel.
- **Expiry Alerts:** Products expiring within 10 days appear in the AI insights and dashboard.
- **Edit Stock:** Open any product and update the quantity directly.
- **Product Variations:** Create variants (size, colour, packaging) for a single product.

### Categories

Go to **Inventory** → **Categories** to organize products. Products can belong to one category.

---

## 3. Point of Sale (POS)

The POS is the fastest way to record in-person sales.

### Making a Sale

1. Go to **POS**.
2. Search for products by name or SKU, or scan a barcode.
3. Tap a product to add it to the cart. Adjust quantity as needed.
4. Apply a **discount** (percentage or fixed amount) if required.
5. Select the **payment method**: Cash, Mobile Money, Card, Bank Transfer.
6. Tap **Charge** to complete the sale.
7. A receipt is generated — print or send digitally to the customer.

### End of Day Report

At the end of each shift, the POS summary shows:
- Total sales and revenue
- Number of transactions
- Payment method breakdown
- Any discounts applied

---

## 4. Managing Orders

### Order Statuses

| Status | Meaning |
|---|---|
| Pending | Order placed, awaiting action |
| Confirmed | Owner or employee confirmed the order |
| Processing | Order is being prepared |
| Shipped | Order dispatched for delivery |
| Delivered | Customer received the order |
| Cancelled | Order was cancelled |

### Updating an Order

1. Go to **Orders**.
2. Click the eye icon on any order to open it.
3. Use the action buttons to move the order to the next status (e.g. Confirm, Mark Shipped, Mark Delivered).
4. Cancellations can be applied at any stage before delivery.

### Filtering Orders

Use the status filter tabs (All, Pending, Confirmed, etc.) or the search bar to find orders by order number or customer name.

---

## 5. Managing Employees

### Assigning an Employee

Employees must have an existing Herufi account before you can assign them.

1. Go to **Employees** → click **Assign Employee**.
2. Search for the user by **name**, **email**, or **phone number**.
3. Select the user from the results.
4. If you have multiple shops, choose which shop to assign them to.
5. Select their **role**:

| Role | Default Permissions |
|---|---|
| Cashier | View inventory, view/process orders, view customers |
| Manager | Full access to all employee-level features |
| Stock Manager | View/edit inventory, view orders, view reports |
| Delivery Manager | View/process orders, view customers |
| Sales Agent | View inventory, process orders, view customers, manage discounts |

6. Customize permissions by checking/unchecking individual items.
7. Click **Assign Employee**.

### Available Permissions

| Permission | Controls |
|---|---|
| view_inventory | See the inventory list |
| edit_inventory | Add, edit, delete products |
| view_orders | See the orders list |
| process_orders | Update order status, confirm/ship |
| view_customers | See the customer list |
| edit_customers | Edit customer records |
| view_reports | Access analytics and reports |
| view_financial | See financial transactions |
| process_refunds | Issue refunds |
| manage_discounts | Apply discounts at POS |

### Editing or Removing an Employee

- Click **Edit** (pencil icon) on an employee card to change role, permissions, or transfer to another shop.
- Click **Remove** (trash icon) to deactivate the employee. They lose access immediately.

---

## 6. Customer Management

### Customer Records

Every customer who places an order at your shop is automatically added to your customer list. You can also add customers manually.

### Loyalty Points

Customers earn **1 loyalty point for every TZS 1,000** spent. Points are visible on the customer's profile and in the customer's app.

### Customer Segments

Herufi automatically tags customers:

| Segment | Criteria |
|---|---|
| New | First-time buyer |
| Regular | Repeat purchases |
| VIP | High-value customers |

### Credit Management

You can record outstanding credit for customers who pay later. The amount appears on their profile and in your financial records.

---

## 7. Analytics

Go to **Analytics** to see visual data about your business.

### Available Charts

| Chart | Description |
|---|---|
| Revenue Over Time | Daily/weekly/monthly revenue trend |
| Units Sold | Product quantity sold over time |
| Top Products | Best-selling products by revenue or units |
| Customer Growth | New vs returning customers |

### Periods

Switch between **7 days**, **30 days**, **90 days**, or **1 year** views.

### Branch Comparison

If you have multiple shops, the analytics page shows each shop's performance side by side.

---

## 8. Financial Tracking

### Recording Transactions

1. Go to **Financial** → click **Add Transaction**.
2. Choose **Income** or **Expense**.
3. Fill in: amount, category, description, payment method, date.
4. Click **Save**.

### Transaction Categories

Common categories include: Sales, Inventory Purchase, Rent, Utilities, Salaries, Transport, Other.

### Summary Cards

The financial page shows:
- **Total Income** for the selected period
- **Total Expenses** for the selected period
- **Net Profit** (income minus expenses)

### Supplier & Customer Debt

Record amounts owed to suppliers or by customers directly on their profiles.

---

## 9. Reports & Exports

Go to **Reports** and select a report type:

| Report | Contains |
|---|---|
| Sales Report | Orders, customers, totals, payment methods, dates |
| Inventory Report | All products, quantities, prices, expiry dates |
| Financial Report | All income and expense transactions |
| Employee Report | Active employees, roles, hired dates, permissions |

### Export Formats

- **Excel (.xlsx)** — Full dataset, best for analysis
- **CSV** — Compatible with any spreadsheet app
- **PDF** — Formatted, printable report (first 60 rows; use Excel for full data)

### Date Range

For Sales and Financial reports, select the **From** and **To** dates before downloading.

---

## 10. AI Assistant

Herufi includes a built-in AI assistant powered by Google Gemini.

### Owner Mode

The AI has live access to your business data and can:
- Identify low-stock and expiring products
- Summarise weekly revenue and trends
- Recommend restocking or pricing actions
- Answer questions in English or Swahili

**Example prompts:**
- "Which products are about to expire?"
- "What were my top 5 products last week?"
- "My sugar sales are low — what should I do?"

### How to Access

Go to **AI Assistant** in the sidebar. The chat keeps history across sessions.

---

## 11. Settings

Go to **Settings** to configure:

| Setting | Options |
|---|---|
| Language | English / Swahili |
| Theme | Light / Dark / System |
| Shop Details | Name, location, logo, category |
| Currency & Tax | Per-shop configuration |
| Notifications | Enable/disable push and in-app alerts |

---

## 12. Multi-Shop Management

You can own and manage **unlimited shops** in Herufi.

### Switching Shops

Click the shop name at the top of the sidebar to open the shop switcher. Select any shop to make it active — all data across the dashboard will update to reflect that shop.

### Branch Performance

The Analytics page shows revenue, orders, and stock status for each branch side by side.

### Assigning Employees Across Shops

When assigning an employee, you can select which of your shops to assign them to. An employee can be assigned to multiple shops.

---

*Last updated: May 2026*
