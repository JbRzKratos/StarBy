# StarBy — Backend Setup & Deployment Guide

## 1. Prerequisites

- **Node.js**: v18.x or v20.x LTS
- **Package Manager**: `npm`
- **Database**: Supabase PostgreSQL
- **Storage**: Cloudflare R2 Bucket
- **Payment Gateway**: Cashfree Payments Account (Sandbox / Production)
- **Transactional Email**: Resend Account

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` and fill in the required credentials:

```bash
cp .env.example .env
```

### Key Variables Explained:

| Variable                        | Scope           | Description                                                    |
| ------------------------------- | --------------- | -------------------------------------------------------------- |
| `DATABASE_URL`                  | Server          | Supabase PostgreSQL connection string (Transaction pooler)     |
| `DIRECT_URL`                    | Server          | Direct PostgreSQL connection string for Prisma migrations      |
| `NEXT_PUBLIC_SUPABASE_URL`      | Client & Server | Supabase project API URL                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public Supabase anon key for client-side Auth                  |
| `CASHFREE_APP_ID`               | Server Only     | Cashfree merchant App ID                                       |
| `CASHFREE_SECRET_KEY`           | Server Only     | Cashfree secret API key (NEVER prefix with NEXT_PUBLIC_)       |
| `CASHFREE_ENVIRONMENT`          | Server          | `"sandbox"` for testing, `"production"` for live transactions  |
| `R2_ACCOUNT_ID`                 | Server Only     | Cloudflare Account ID                                          |
| `R2_ACCESS_KEY_ID`              | Server Only     | Cloudflare R2 S3-compatible Access Key ID                      |
| `R2_SECRET_ACCESS_KEY`          | Server Only     | Cloudflare R2 S3-compatible Secret Access Key                  |
| `R2_BUCKET_NAME`                | Server Only     | Bucket name (e.g. `starby-designs`)                            |
| `R2_ENDPOINT`                   | Server Only     | `https://<account_id>.r2.cloudflarestorage.com`                |
| `RESEND_API_KEY`                | Server Only     | Resend API key for order confirmation & tracking emails        |
| `NEXT_PUBLIC_SITE_URL`          | Client & Server | Base URL (e.g. `https://starby.in` or `http://localhost:3000`) |

---

## 3. Database Schema & Prisma

1. **Generate Prisma Client**:

   ```bash
   npx prisma generate
   ```

2. **Push Schema to Database**:
   ```bash
   npx prisma db push
   ```

---

## 4. Cashfree Merchant Dashboard Configuration

1. Log in to [Cashfree Merchant Dashboard](https://merchant.cashfree.com/).
2. Navigate to **Payment Gateway > Developers > API Keys**.
3. Generate and copy your **App ID** and **Secret Key**.
4. Navigate to **Developers > Webhooks**:
   - Add Webhook URL: `https://yourdomain.com/api/webhooks/cashfree`
   - Select Events: `ORDER_PAID`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `PAYMENT_USER_DROPPED`
   - Test the webhook endpoint to ensure `200 OK` response.

---

## 5. Cloudflare R2 Bucket Setup

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) > **R2**.
2. Create a bucket named `starby-designs` (Private access).
3. Under **Manage R2 API Tokens**, create a token with **Object Read & Write** permissions.
4. Set CORS policy on the bucket to allow PUT requests from your site domain:
   ```json
   [
     {
       "AllowedOrigins": ["https://starby.in", "http://localhost:3000"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

---

## 6. Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run typecheck & lint
npm run typecheck
npm run lint

# Build for production
npm run build
```
