# Claw Installer

A professional SaaS platform for installing and hosting OpenClaw instances.

## Features

- **Three Tier System**
  - **Tier 1 (DIY)**: $29.99 one-time - Setup guides, AI support, video tutorials
  - **Tier 2 (Assisted)**: $44.99 one-time - Everything in Tier 1 + 1-on-1 human support
  - **Tier 3 (Managed)**: $99.99/month - Fully managed GCP instance with auto-provisioning

- **Payment Options**
  - Stripe (credit/debit cards)
  - NowPayments (crypto: BTC, ETH, USDC)

- **Tech Stack**
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - MongoDB (Mongoose)
  - NextAuth.js (email/password + Google OAuth)
  - Stripe
  - NowPayments
  - Google Cloud Platform (Compute Engine)

## Setup

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `MONGODB_URI` - MongoDB connection string
   - `NEXTAUTH_SECRET` - Random secret for NextAuth
   - `NEXTAUTH_URL` - Your app URL (e.g., https://clawinstaller.xyz)
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
   - `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET` - Stripe API keys
   - `STRIPE_PRICE_TIER1/2/3` - Stripe Price IDs for each tier
   - `NOWPAYMENTS_API_KEY` & `NOWPAYMENTS_IPN_SECRET` - NowPayments credentials
   - `GCP_PROJECT_ID`, `GCP_ZONE`, `GCP_SERVICE_ACCOUNT_KEY`, `GCP_BASE_IMAGE` - GCP config

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
claw-installer/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utility libraries
│   ├── models/           # Mongoose models
│   └── types/            # TypeScript types
├── public/               # Static assets
└── package.json
```

## API Routes

- `/api/auth/*` - Authentication (NextAuth)
- `/api/payments/stripe/*` - Stripe payments
- `/api/payments/nowpayments/*` - Crypto payments
- `/api/provisioner/*` - VM management (Tier 3)
- `/api/booking` - Support session booking
- `/api/chat` - AI support chat

## Dashboard Pages

- `/dashboard` - Main dashboard
- `/dashboard/guide` - Setup guide (Tier 1+)
- `/dashboard/chat` - AI support chat (Tier 1+)
- `/dashboard/booking` - Book support session (Tier 2+)
- `/dashboard/instance` - Manage VM instance (Tier 3)

## Stripe Webhooks

Configure webhook endpoint in Stripe dashboard:
```
https://yourdomain.com/api/payments/stripe/webhook
```

Listen for events:
- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.deleted`

## NowPayments IPN

Configure IPN callback URL in NowPayments:
```
https://yourdomain.com/api/payments/nowpayments/webhook
```

## License

MIT
