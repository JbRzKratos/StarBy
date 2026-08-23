# StarBy — Cashfree Payments Integration Architecture & Payment Flow

## 1. Overview

StarBy uses **Cashfree Payments (API Version `2025-01-01`)** as its primary online payment gateway, supporting UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), Netbanking, and Wallets, alongside Cash on Delivery (COD).

---

## 2. Architecture & Security Standards

```
+-------------------------------------------------------------------------------+
|                                  BROWSER                                      |
|                                                                               |
|  [Cart / Checkout]  -- (1) POST /api/checkout --> [ Next.js App Router API ]  |
|                                                              |                |
|                                                     (2) Recalculate Prices    |
|                                                     (3) Validate Stock/Coupon |
|                                                     (4) Create Cashfree Order |
|                                                              |                |
|  [Cashfree JS SDK]  <-- (5) Returns paymentSessionId --------+                |
|         |                                                                     |
|         +-- (6) cashfree.checkout({ paymentSessionId })                       |
|         |                                                                     |
+---------|---------------------------------------------------------------------+
          |
          v
+-----------------------+                         +-----------------------------+
|    CASHFREE HOSTED    |                         |      STARBY BACKEND         |
|      PAYMENT PG       |                         |                             |
|                       | -- (7) Webhook Event -> | POST /api/webhooks/cashfree |
|  Customer pays via    |                         |  - Verify HMAC Signature    |
|  UPI / Card / Netbank |                         |  - Check Idempotency Table  |
|                       |                         |  - Update Order: 'paid'     |
|                       |                         |  - Decrement Stock          |
|                       |                         |  - Dispatch Confirm Email   |
|                       |                         +-----------------------------+
|                       |
| (8) Redirects browser |
|     to return_url     |
v                       v
+-------------------------------------------------------------------------------+
|  BROWSER: /payment/status?order_id=STB_2026_XXXXX                             |
|                                                                               |
|  (9) Client fast-path verification --> POST /api/verify-payment               |
|                                           |                                   |
|                                        (10) Query Cashfree Server API         |
|                                           |                                   |
|  (11) Render Payment Confirmed Screen <---+                                   |
|       and clear cart                                                          |
+-------------------------------------------------------------------------------+
```

### Security Rules Enforced:

1. **Server-Side Price Recalculation**: The server re-fetches product base prices and variant prices from Supabase/Prisma DB. Client-submitted prices are ignored.
2. **Stock Availability Validation**: Prior to payment initiation, variant stock is verified (`stockQuantity >= requestedQuantity` and `inStock === true`).
3. **Secret Isolation**: `CASHFREE_SECRET_KEY` and `CASHFREE_APP_ID` are strictly server-side environment variables. No secrets are prefixed with `NEXT_PUBLIC_`.
4. **Idempotency Safeguard**: Webhook payloads are hashed and deduplicated using the `WebhookEvent` table (`@@unique([provider, eventId])`). Duplicate notifications are safely acknowledged without double processing or inventory leaks.
5. **Edge-Compatible Web Crypto API**: Webhook signatures are validated using standard `crypto.subtle` HMAC-SHA256, compatible with Cloudflare Workers / Edge Runtime.

---

## 3. API Endpoints

### 3.1 `POST /api/checkout`

- **Request Body**:
  ```json
  {
    "items": [{ "productId": "p1", "variantId": "v1", "quantity": 1, "size": "L" }],
    "address": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "street": "123 Street",
      "city": "Bengaluru",
      "state": "Karnataka",
      "zip": "560001",
      "country": "India",
      "phone": "9876543210"
    },
    "paymentMethod": "cashfree",
    "couponCode": "STAR10"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "orderId": "clx...",
    "publicOrderId": "STB-2026-10492AB",
    "paymentSessionId": "session_...",
    "cashfreeOrderId": "STB_2026_10492AB",
    "cashfreeEnvironment": "sandbox",
    "amount": 1499,
    "isCod": false
  }
  ```

### 3.2 `POST /api/verify-payment`

- **Request Body**: `{ "cashfreeOrderId": "STB_2026_10492AB" }`
- **Behavior**: Calls Cashfree `GET /orders/{order_id}` and atomic DB transaction to update order status.

### 3.3 `POST /api/webhooks/cashfree`

- **Headers**:
  - `x-webhook-signature`: Base64 HMAC-SHA256 signature
  - `x-webhook-timestamp`: Request timestamp
- **Behavior**: Validates signature against raw body + timestamp, ensures idempotency, confirms payment, decrements stock, sends emails.

---

## 4. Refund & Cancellation Flow

1. Admin initiates refund or status update to `cancelled`/`refunded` in Admin Order Detail.
2. System logs status transition into `OrderStatusHistory`.
3. Inventory is returned to stock if previously decremented.
