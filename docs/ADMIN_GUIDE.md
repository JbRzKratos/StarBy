# StarBy — Admin Operations & Order Fulfillment Guide

## 1. Access & Role-Based Access Control (RBAC)

The StarBy Admin Portal (`/admin`) is gated with server-side RBAC:

- **`ADMIN`**: Full permissions across Orders, Products, Categories, Coupons, Staff Role Management, Analytics, and Store Settings.
- **`STAFF`**: Order fulfillment, tracking updates, internal notes, product inventory adjustments.
- **`CUSTOMER`**: Redirected away to `/`.

---

## 2. Order Management Workflow

### 2.1 Order Lifecycle

```
[ pending_payment ] -> [ placed ] -> [ processing ] -> [ shipped ] -> [ delivered ]
                                  \
                                   -> [ cancelled ] / [ refunded ]
```

1. **New Orders**: Appear automatically in the **Orders Manager** with `placed` (for COD or confirmed Cashfree payments) or `pending_payment` (awaiting payment).
2. **Order Details**: Click on any order to view:
   - Customer shipping details and contact information
   - Gateway information (Cashfree Order ID, Payment Ref)
   - Order items with customized size and variant
   - **Custom Artwork**: If the item includes customer-uploaded designs, direct download links to the Cloudflare R2 file are displayed.
3. **Internal Notes**: Add staff-only notes (e.g. "Customer requested delivery after 6 PM", "Awaiting proof approval") that remain hidden from the customer.

### 2.2 Shipping & Dispatch

When an order status is updated to `shipped`:

1. The Admin portal prompts for:
   - **Carrier Name** (e.g. Delhivery, BlueDart, DTDC)
   - **Tracking Number** (AWB / Consignment ID)
   - **Tracking URL** (direct link for live courier tracking)
2. Saving automatically sends a transactional **Order Shipped Email** to the customer containing the tracking link and estimated arrival.

### 2.3 Delivery Confirmation

Updating status to `delivered` automatically triggers an **Order Delivered Email** asking the customer for their review.

---

## 3. Product & Inventory Management

- **Add/Edit Products**: Manage base prices, descriptions, sizing options, and tags.
- **Variant Stock Management**: Set stock quantity and reorder thresholds. The checkout API automatically checks stock availability before processing payments.
- **Customizable Flag**: Mark products as `customizable` to enable custom artwork uploads and customizer canvas options.

---

## 4. Coupons & Promotions

- Create discount codes as **Percentage** (e.g. 10%) or **Flat Amount** (e.g. ₹200).
- Set expiration dates, minimum order values, maximum total uses, and **per-customer usage limits** (enforced on server).

---

## 5. Staff Management (Admin Only)

- Promote registered customer accounts to **STAFF** or **ADMIN** by email.
- Demote staff back to customer status when needed.
