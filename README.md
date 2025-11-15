# FrictionlessAuthLayer

> A unified authentication and integration layer to streamline user onboarding with Stripe, email, and other services.

## 🎯 Overview

**FrictionlessAuthLayer** is a headless, API-first platform that simplifies integration setup for solo builders and small teams. Instead of managing multiple authentication providers, payment systems, email services, and CRMs across different platforms, FrictionlessAuthLayer provides a single unified interface to configure everything.

### Key Features

- **Unified Setup** - Configure Stripe, SendGrid, OAuth providers, and CRMs in one dashboard
- **Secure by Default** - AES-256-GCM encrypted credential storage with HMAC-SHA256 webhook signatures
- **Auto Configuration** - Automatically fetch product IDs, webhooks, and identifiers from services
- **ENV Management** - Generate complete `.env` files with a single click
- **Code Snippets** - Copy-paste ready integration code for your apps
- **SmartHooks Integration** - Emit events to [Vantrakticks SmartHooks](https://smarthooks.vantrakticks.com) for workflow automation
- **Form Templates** - Pre-built onboarding forms with optional custom field builder
- **API-First** - Use as a microservice or integrate directly

## 📋 Supported Integrations

### Payment Processing
- ✅ **Stripe** - Accept payments, manage subscriptions, auto-fetch product/price IDs

### Email Services
- ✅ **SendGrid** - Transactional and marketing emails with templates

### Authentication
- ✅ **Google OAuth** - Sign in with Google
- ✅ **GitHub OAuth** - Sign in with GitHub

### CRM Systems
- ✅ **HubSpot** - Sync contacts and leads
- ✅ **Salesforce** - Enterprise CRM integration

### Marketing Automation
- ✅ **Mailchimp** - Email campaigns and audience management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- SQLite (default) or PostgreSQL database

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/Smart_Onboarding.git
cd Smart_Onboarding
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database
DATABASE_URL="file:./dev.db"

# Security - CHANGE THESE IN PRODUCTION!
AUTH_SECRET="your-random-secret-minimum-32-chars"
WEBHOOK_SIGNING_SECRET="your-webhook-secret"

# SmartHooks (Vantrakticks Integration)
SMARTHOOKS_WEBHOOK_URL="https://smarthooks.vantrakticks.com/api/event"
SMARTHOOKS_API_KEY="your-smarthooks-api-key"
```

4. **Initialize the database**

```bash
npx prisma generate
npx prisma db push
```

5. **Start the development server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### 1. Create a Project

Navigate to `/dashboard` and create a new project. Each project represents an application you're building.

### 2. Configure Integrations

Add integrations like Stripe, SendGrid, etc. Enter your credentials once - they're encrypted and stored securely.

**Example: Adding Stripe**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your Secret Key, Publishable Key, and Webhook Secret
3. Paste them into FrictionlessAuthLayer
4. Click "Save Integration"

### 3. Generate ENV File or Code Snippets

**Option A: ENV File**

```bash
GET /api/env/generate?projectId=your-project-id
```

Download the generated `.env` file and add it to your application.

**Option B: Code Snippets**

```bash
GET /api/snippets/generate?projectId=your-project-id&type=stripe
```

Copy the generated code directly into your app.

### 4. Use in Your Application

#### Stripe Integration Example

```typescript
import { StripeIntegration } from '@/lib/integrations/stripe'

// Create a checkout session
const stripe = await StripeIntegration.fromProject('your-project-id')

const session = await stripe.createCheckoutSession({
  priceId: 'price_xxx',
  successUrl: 'https://yourapp.com/success',
  cancelUrl: 'https://yourapp.com/cancel',
  customerEmail: 'user@example.com'
})

// Redirect user
window.location.href = session.url
```

#### SendGrid Email Example

```typescript
import { SendGridIntegration } from '@/lib/integrations/sendgrid'

const sendgrid = await SendGridIntegration.fromProject('your-project-id')

await sendgrid.sendWelcomeEmail({
  to: 'user@example.com',
  name: 'John Doe',
  verificationUrl: 'https://yourapp.com/verify?token=xxx'
})
```

#### SmartHooks Event Example

```typescript
import { emitEvent } from '@/lib/webhooks/smarthooks'

await emitEvent(
  'user.signup',
  'your-project-id',
  {
    userId: user.id,
    email: user.email,
    name: user.name,
    signupMethod: 'email'
  },
  user.id
)
```

## 🔧 API Reference

### Integrations API

#### List Integrations

```http
GET /api/integrations?projectId=xxx
```

#### Create/Update Integration

```http
POST /api/integrations
Content-Type: application/json

{
  "projectId": "xxx",
  "accountId": "yyy",
  "type": "stripe",
  "credentials": {
    "secret_key": "sk_test_xxx",
    "publishable_key": "pk_test_xxx",
    "webhook_secret": "whsec_xxx"
  },
  "enabled": true
}
```

#### Delete Integration

```http
DELETE /api/integrations?id=xxx
```

### ENV Generation API

```http
GET /api/env/generate?projectId=xxx
```

Returns:

```json
{
  "content": "# Generated ENV file content...",
  "filename": ".env.your-project-slug"
}
```

### Code Snippets API

```http
GET /api/snippets/generate?projectId=xxx&type=stripe
```

Returns:

```json
{
  "snippets": {
    "stripe": "// Code snippet...",
    "sendgrid": "// Code snippet..."
  }
}
```

### SmartHooks Webhook API

```http
POST /api/webhooks/smarthooks
Content-Type: application/json

{
  "eventType": "user.signup",
  "projectId": "xxx",
  "userId": "123",
  "data": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## 🎨 Form Templates

FrictionlessAuthLayer includes pre-built form templates for common onboarding flows:

- **Email & Password Sign Up** - Basic registration
- **Stripe Payment Setup** - Payment collection
- **Business Profile** - Company information
- **OAuth Social** - Google/GitHub sign-in
- **Team Invite** - Invite team members

Templates are defined in `src/config/form-templates.ts` and can be customized.

## 🔐 Security

### Credential Encryption

All sensitive credentials are encrypted using **AES-256-GCM** before storage. The encryption key is derived from `AUTH_SECRET` in your environment.

### Webhook Signatures

All webhooks sent to SmartHooks are signed with **HMAC-SHA256** to prevent tampering.

```typescript
const signature = generateSignature(payload, SMARTHOOKS_API_KEY)
```

### Best Practices

1. **Never commit `.env` files** - Use `.env.example` as a template
2. **Rotate secrets regularly** - Update `AUTH_SECRET` periodically
3. **Use environment-specific keys** - Different keys for dev/staging/production
4. **Enable HTTPS** - Always use SSL/TLS in production

## 🏗️ Architecture

FrictionlessAuthLayer is designed as a **standalone microservice** that integrates with your existing applications:

```
┌─────────────────────────────────────────────────┐
│        FrictionlessAuthLayer (This Repo)        │
│                                                 │
│  ┌──────────────┐      ┌──────────────┐       │
│  │  Next.js App │◄────►│   Dashboard  │       │
│  │              │      │   (Config UI)│       │
│  └──────┬───────┘      └──────────────┘       │
│         │                                       │
│  ┌──────▼────────────────────────────┐        │
│  │     Integration Engine             │        │
│  │  - Stripe/Square Auth              │        │
│  │  - SendGrid/Email Provider         │        │
│  │  - CRM Connectors (HubSpot, etc.)  │        │
│  │  - Webhook Event Emitter           │        │
│  └──────┬────────────────────────────┘        │
│         │                                       │
└─────────┼───────────────────────────────────────┘
          │ Signed Webhooks (HMAC-SHA256)
          ▼
┌─────────────────────────────────────────────────┐
│     SmartHooks (Vantrakticks Mono Repo)        │
│   https://smarthooks.vantrakticks.com/api/event│
│                                                 │
│  - Event Registry & Delivery Engine            │
│  - Triggers downstream automations             │
└─────────────────────────────────────────────────┘
```

## 📂 Project Structure

```
Smart_Onboarding/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js 13+ app directory
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Auth endpoints
│   │   │   ├── integrations/ # Integration CRUD
│   │   │   ├── webhooks/     # Webhook handlers
│   │   │   ├── env/          # ENV generator
│   │   │   └── snippets/     # Code snippet generator
│   │   ├── dashboard/        # Dashboard UI (WIP)
│   │   └── onboarding/       # User-facing flows (WIP)
│   ├── components/
│   │   ├── ui/               # UI components
│   │   ├── forms/            # Form templates
│   │   └── builder/          # Form builder (WIP)
│   ├── lib/
│   │   ├── integrations/     # Service connectors
│   │   │   ├── stripe.ts
│   │   │   └── sendgrid.ts
│   │   ├── webhooks/
│   │   │   └── smarthooks.ts # SmartHooks client
│   │   ├── utils/
│   │   │   └── crypto.ts     # Encryption utilities
│   │   └── prisma.ts         # Prisma client
│   └── config/
│       ├── integrations.ts   # Integration definitions
│       └── form-templates.ts # Form templates
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Development

### Running Tests (Coming Soon)

```bash
npm run test
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

### Building for Production

```bash
npm run build
npm run start
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
AUTH_SECRET="production-secret-minimum-32-chars-random"
WEBHOOK_SIGNING_SECRET="production-webhook-secret"
SMARTHOOKS_WEBHOOK_URL="https://smarthooks.vantrakticks.com/api/event"
SMARTHOOKS_API_KEY="prod-api-key"
NEXT_PUBLIC_APP_URL="https://yourapp.com"
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database with [Prisma](https://www.prisma.io/)
- Integrates with [Vantrakticks SmartHooks](https://smarthooks.vantrakticks.com)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/Smart_Onboarding/issues)
- **Docs**: [Documentation](https://docs.yourapp.com)
- **Email**: support@yourapp.com

---

**Built with ❤️ for solo builders and small teams**
