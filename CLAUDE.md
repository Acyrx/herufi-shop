@AGENTS.md
Create a modern, scalable, AI-ready e-commerce and business management platform called Herufi focused on wholesalers, retailers, and multi-shop businesses in Tanzania and Africa. The system should combine POS, inventory management, analytics, employee management, customer management, and order management into one seamless platform with a clean, fast, mobile-first experience.

The app must support these core roles:

Shop Owner — manages shops, employees, inventory, analytics, and finances.
Employee — assigned permissions by the owner (cashier, inventory manager, sales agent, etc.).
Customer — browses products, places orders, tracks purchases, and receives loyalty rewards.
Admin/System Manager — oversees the whole platform, verifies businesses, handles reports, and manages system health.
Core Features

1. Authentication & User System
   Secure signup/login using email, phone number, or Google.
   JWT/session authentication.
   Role-based access control.
   User profile management.
   Password reset and OTP verification.
   Multi-device login support.
2. Multi-Shop Business System
   A single owner can create and manage multiple shops.
   Each shop has:
   Name
   Logo
   Location
   Contact info
   Business category
   Currency & tax settings default TZS
   Shop switching functionality.
   Branch performance comparison.
3. Inventory Management

Build a powerful inventory system with:

Product creation/editing.
SKU/barcode generation.
Product categories and subcategories.
Batch tracking.
Stock quantity tracking.
Expiry date tracking.
Low-stock alerts.
Product image uploads.
Supplier information.
Purchase cost vs selling price.
Product variations:
size
color
weight
packaging
Inventory history logs.
Stock transfer between branches.
Damaged/lost stock recording. 4. AI-Powered Smart Inventory

Include AI features such as:

Demand prediction.
Restock recommendations.
Expiry risk detection.
Smart pricing suggestions.
Sales trend forecasting.
AI-generated business insights.

Example:

“Rice sales increased 28% this week. Consider restocking before Friday.”

5. POS (Point of Sale)
   Fast cashier interface.
   Barcode scanning.
   Receipt generation.
   Offline mode support.
   Discount handling.
   Tax calculations.
   Daily sales closing report.
6. Dashboard & Analytics

Create a beautiful dashboard with:

Total revenue.
Profit visualization.
Sales analytics.
Daily/weekly/monthly charts.
Best-selling products.
Expiry alerts.
Low-stock products.
Order tracking.
Employee performance.
Branch comparisons.
Customer growth.
Revenue heatmaps.
Financial summaries.

Use:

interactive charts
KPI cards
trend indicators
downloadable reports 7. Orders & E-Commerce
Online product catalog.
Customer cart and checkout.
Order placement and tracking.
Delivery status tracking.
Order history.
Returns and refunds.
Mobile-first shopping experience. 8. Customer Management
Customer registration.
Purchase history.
Loyalty points system.
Customer segmentation.
AI-powered recommendations. 9. Employee Assignment System

The owner can:

Search registered users from the database using:
phone number
email
username
Assign employees to specific shops.
Give custom permissions and roles.
Monitor employee activity logs.
Track sales performance per employee.

Employee role examples:

cashier
manager
stock manager
delivery manager 10. Notifications & Alerts

Real-time alerts for:

low stock
expiring products
completed orders
failed payments
employee activity
unusual sales activity

Support:

push notifications
in-app notifications 11. Financial System
Profit/loss tracking.
Expense recording.
Supplier debt management.
Customer credit management.
Transaction history.
Automated financial summaries.
Tax reporting support. 12. Reports & Exporting

Allow exporting:

sales reports
inventory reports
financial reports
employee reports

Formats:

PDF
Excel
CSV 13. Mobile Experience
Fully responsive UI.
Android-first optimization.
Progressive Web App support.
Offline synchronization.
Fast loading and smooth animations.

Digital receipts.
Subscription plans.
Dark/light mode.
Multi-language support (English + Swahili).
Marketplace mode (multiple businesses selling together).
Gemini API

database is supabase and storage is supabase
