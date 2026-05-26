# Employee Guide

As a **Herufi Employee**, you work at a shop that an owner has assigned you to. Your access is determined by the **permissions** your owner configured for your role.

---

## Table of Contents

1. [Getting an Account](#1-getting-an-account)
2. [Being Assigned to a Shop](#2-being-assigned-to-a-shop)
3. [Logging In](#3-logging-in)
4. [Choosing Your Workspace](#4-choosing-your-workspace)
5. [Your Dashboard](#5-your-dashboard)
6. [Using the POS](#6-using-the-pos)
7. [Managing Inventory](#7-managing-inventory)
8. [Managing Orders](#8-managing-orders)
9. [Viewing Customers](#9-viewing-customers)
10. [Switching Workspaces](#10-switching-workspaces)
11. [Permissions Reference](#11-permissions-reference)

---

## 1. Getting an Account

If you don't have a Herufi account yet:

1. Open the Herufi app and tap **Create account**.
2. Enter your **Full Name**, **Email**, **Phone** (optional), and **Password**.
3. For **Role**, select either **Shop Owner** or **Customer** — the employee role is assigned by your employer, not chosen at sign-up.
4. Tap **Create Account**.

> **Tell your employer your email or phone number** so they can search for you and assign you to their shop.

---

## 2. Being Assigned to a Shop

You do not assign yourself. Your employer (the shop owner) will:

1. Search for your account using your name, email, or phone.
2. Select a role for you (Cashier, Manager, Stock Manager, Delivery Manager, or Sales Agent).
3. Set specific permissions (e.g. "can process orders", "can view inventory").
4. Tap **Assign Employee**.

You will gain access immediately on your next login.

---

## 3. Logging In

1. Go to the Herufi login page.
2. Enter your **email** and **password**.
3. Tap **Sign In**.

> **Security:** After 5 failed login attempts, your account is locked for 15 minutes.

---

## 4. Choosing Your Workspace

If you have been assigned as an employee, you will see the **Workspace Selector** screen after login. It shows two sections:

### Work as Employee

Each shop you are assigned to appears as a card showing:
- Shop name and location
- Your role (e.g. Cashier, Manager)
- Number of permissions granted

Tap a shop card to enter that shop's dashboard with your employee permissions.

### My Own Business

If you also run your own business, tap here to switch to owner mode and manage your own shops.

> You can switch between workspaces at any time — see [Switching Workspaces](#10-switching-workspaces).

---

## 5. Your Dashboard

After choosing a shop, you land on the **Dashboard**. It shows:
- Today's revenue and order count for your shop
- Low-stock and expiry alerts
- Recent orders
- AI business insights

The **sidebar** only shows sections you have permission to access. Owner-only areas (My Shops, Employees, Settings) are hidden.

---

## 6. Using the POS

> Requires: `process_orders` permission

The POS is the main tool for cashiers and sales agents.

### Processing a Sale

1. Go to **POS** in the sidebar.
2. Search for a product by name or SKU.
3. Tap the product to add it to the cart. Change quantity if needed.
4. Apply a **discount** if you have the `manage_discounts` permission.
5. Select the **payment method** (Cash, Mobile Money, etc.).
6. Tap **Charge** to complete the transaction.
7. A receipt is generated automatically.

### What If a Product Is Not Found?

The product may not exist in inventory yet. Contact your manager or shop owner to add it.

---

## 7. Managing Inventory

> Requires: `view_inventory` (to view) and `edit_inventory` (to add/edit)

### Viewing Inventory

Go to **Inventory** to see all products. You can filter by category or search by name/SKU.

### Editing Stock (if permitted)

1. Click on a product to open it.
2. Update the quantity, price, or expiry date.
3. Click **Save**.

### Adding a Product (if permitted)

Click **Add Product** and fill in the product details.

> You cannot delete products — only owners can deactivate them.

---

## 8. Managing Orders

> Requires: `view_orders` (to view) and `process_orders` (to update status)

### Viewing Orders

Go to **Orders** to see all orders for your shop. Use the search bar and status filters to find specific orders.

### Updating Order Status

1. Click the eye icon on an order.
2. Use the action buttons to advance the order:
   - **Confirm** → Processing → Shipped → Delivered
   - **Cancel** (if still pending)

---

## 9. Viewing Customers

> Requires: `view_customers` permission

Go to **Customers** to view the list of your shop's customers. You can see:
- Customer name and contact info
- Purchase history
- Loyalty points balance
- Outstanding credit

> Editing customer records requires `edit_customers` permission.

---

## 10. Switching Workspaces

You can switch between your employee shops or your own business without signing out.

**From the sidebar:**
1. Look at the shop name at the top of the sidebar.
2. Below it, click **Switch workspace**.
3. The Workspace Selector opens — choose a different shop or switch to your own business.

---

## 11. Permissions Reference

Your owner configures which sections you can access. If you try to visit a page you don't have access to, you will be redirected to the dashboard automatically.

| Permission | What It Unlocks |
|---|---|
| `view_inventory` | See the Inventory page |
| `edit_inventory` | Add, edit products |
| `view_orders` | See the Orders page |
| `process_orders` | Use POS, update order status |
| `view_customers` | See the Customers page |
| `edit_customers` | Edit customer profiles |
| `view_reports` | Access Analytics, Reports, Sales pages |
| `view_financial` | See the Financial page |
| `process_refunds` | Issue refunds on orders |
| `manage_discounts` | Apply discounts at POS |

If you need additional access, ask your shop owner to update your permissions in the **Employees** section.

---

*Last updated: May 2026*
