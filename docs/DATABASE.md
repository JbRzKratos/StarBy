# StarBy — Database Architecture & Entity-Relationship Schema

## 1. Overview

StarBy's database is hosted on **Supabase PostgreSQL** and modeled using **Prisma ORM**. The schema is optimized for e-commerce, custom apparel/merchandise design workflows, multi-item order fulfillment, and idempotent payment processing.

---

## 2. Entity-Relationship Summary

```
                      +-------------------+
                      |       User        |
                      +-------------------+
                        | 1             1 |
                        |                 |
                        v *             v *
               +---------------+   +--------------------+
               |    Address    |   |  CustomizerDesign  |
               +---------------+   +--------------------+
                        |
                        | (snapshots into)
                        v
               +-------------------+
               |       Order       | <--- 1:N ---> [ OrderStatusHistory ]
               +-------------------+
                 | 1             1 | <--- 1:N ---> [ WebhookEvent (idempotency) ]
                 |                 |
                 v *               v 1
         +---------------+   +--------------------+
         |   OrderItem   |   |   Coupon (used)    |
         +---------------+   +--------------------+
           | 1
           | 1
           v 1
   +--------------------+
   | OrderCustomization | (R2 artwork files & print specs)
   +--------------------+
```

---

## 3. Core Models & Schema Reference

### 3.1 `Order`

- **`id`**: Internal unique CUID (`string`)
- **`publicOrderId`**: Human-readable public ID (e.g. `STB-2026-92817AB`)
- **`userId`**: Foreign key to `User.id` (nullable for guest checkouts)
- **`subtotal`**: Sum of item prices before discounts/shipping
- **`discount`**: Total promotional discount applied
- **`shippingFee`**: Delivery charge
- **`tax`**: Goods & Services Tax
- **`total`**: Final charged amount (`subtotal - discount + shippingFee + tax`)
- **`currency`**: Default `"INR"`
- **`status`**: Current fulfillment state (`pending_payment`, `placed`, `processing`, `shipped`, `delivered`, `cancelled`)
- **`paymentStatus`**: Gateway settlement state (`pending`, `paid`, `failed`, `refunded`)
- **`paymentProvider`**: `"cashfree"`, `"cod"`, or historical `"razorpay"`
- **`paymentGatewayOrderId`**: Cashfree order ID (e.g. `STB_2026_92817AB`)
- **`paymentGatewayPaymentId`**: Cashfree payment ID reference
- **`shippingAddress`**: Immutable JSON snapshot of the customer's shipping address
- **`carrier`**: Courier partner (e.g. Delhivery, BlueDart, DTDC)
- **`trackingNumber`**: Airway bill (AWB) number
- **`trackingUrl`**: Direct tracking URL
- **`internalNotes`**: Staff-only private notes

### 3.2 `OrderItem`

- **`id`**: Unique line item CUID
- **`orderId`**: Parent order reference
- **`productId`**: Catalog product identifier
- **`variantId`**: Color / style variant ID
- **`productNameSnapshot`**: Product title frozen at checkout time
- **`skuSnapshot`**: SKU / variant code frozen at checkout time
- **`quantity`**: Quantity ordered
- **`unitPrice`**: Unit price frozen at checkout time
- **`totalPrice`**: `unitPrice * quantity`
- **`size`**: Selected apparel / poster size (e.g. `"M"`, `"XL"`, `"A3"`)
- **`customization`**: Legacy canvas JSON state

### 3.3 `OrderCustomization`

- **`id`**: Unique customization record ID
- **`orderItemId`**: One-to-one link to `OrderItem`
- **`designFileUrl`**: Time-limited pre-signed download URL
- **`designFileKey`**: Cloudflare R2 object storage key
- **`designFileName`**: Original customer uploaded filename
- **`designFileType`**: MIME type (`image/png`, `image/jpeg`, `application/pdf`)
- **`designFileSize`**: File size in bytes
- **`printPosition`**: Targeted print placement (`"front"`, `"back"`, `"full-wrap"`)
- **`printInstructions`**: Customer custom notes or design requests
- **`productionStatus`**: Workshop status (`pending`, `design_received`, `review`, `approved`, `printing`, `completed`)

### 3.4 `OrderStatusHistory`

- **`id`**: Unique log entry ID
- **`orderId`**: Order reference
- **`oldStatus`**: Previous status
- **`newStatus`**: Updated status
- **`changedBy`**: User ID, `"system"`, or `"webhook"`
- **`note`**: Descriptive change note

### 3.5 `WebhookEvent`

- **`id`**: Record ID
- **`provider`**: `"cashfree"`
- **`eventId`**: Gateway event ID / transaction ID
- **`eventType`**: `"PAYMENT_SUCCESS"`, `"PAYMENT_FAILED"`, etc.
- **`orderId`**: Internal order reference
- **`payload`**: Full raw JSON payload for audit and debugging
- **Index**: `@@unique([provider, eventId])` guarantees exactly-once processing.

---

## 4. Maintenance & Migrations

Whenever `prisma/schema.prisma` is updated:

```bash
# Generate Prisma Client
npx prisma generate

# Apply to database
npx prisma db push
```
