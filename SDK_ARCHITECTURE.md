# FrictionlessAuthLayer SDK Architecture

## 🎯 Vision: One-Line Integration

The goal is to make integration as simple as adding Google Analytics:

```html
<!-- Option 1: Script Tag -->
<script src="https://cdn.frictionless.app/v1/sdk.js" data-api-key="fal_abc123"></script>
```

```typescript
// Option 2: NPM Package
import Frictionless from '@frictionless/sdk'

const auth = new Frictionless({ apiKey: 'fal_abc123' })
```

That's it! No complex configuration, no environment variables to manage.

---

## 🏗️ System Components

### 1. **Platform (Backend) - This Repo**

Located: `Smart_Onboarding/`

**Purpose**: Central hub for managing authentication, payments, emails, and user data

**Key Features**:
- Developer dashboard (create projects, configure integrations)
- API key generation
- Integration management (Stripe, SendGrid, OAuth providers)
- Email template editor
- Lightweight CRM (EndUser tracking)
- SmartHooks webhook emission

**Authentication**: NextAuth.js (for developers logging into the dashboard)

**API Endpoints**:
- `/api/projects` - Project CRUD
- `/api/integrations` - Service integration management
- `/api/email-templates` - Email template management
- `/api/end-users` - Lightweight CRM
- `/api/end-users/export` - Export to HubSpot/Salesforce
- `/api/sdk/*` - Protected SDK endpoints (require API key)

---

### 2. **JavaScript SDK (Client)**

Location: To be created in `packages/sdk/`

**Purpose**: Embeddable library that developers install in their apps

**Features**:
- User authentication (email/password, OAuth)
- Pre-built UI components (signup/login modals)
- Payment handling (Stripe integration)
- User session management
- Event tracking

**Example Usage**:

```typescript
import Frictionless from '@frictionless/sdk'

const frictionless = new Frictionless({
  apiKey: 'fal_abc123',
  domain: 'myapp.com'
})

// Show signup modal
await frictionless.auth.showSignup()

// Handle authentication
frictionless.auth.onStateChange((user) => {
  if (user) {
    console.log('User logged in:', user)
  }
})

// Create subscription
await frictionless.payments.createCheckout({
  priceId: 'price_xxx',
  successUrl: '/success',
  cancelUrl: '/pricing'
})

// Track events (automatically sent to SmartHooks)
frictionless.track('button_clicked', { button: 'upgrade' })
```

---

## 🔄 Integration Flow

### Developer Setup (One-Time)

```
┌─────────────────────────────────────────────────┐
│  1. Developer signs up on FrictionlessAuthLayer │
│     (via Google, GitHub, or Microsoft)          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  2. Create a project in dashboard               │
│     Project Name: "My SaaS App"                 │
│     Domain: "myapp.com"                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  3. Configure integrations                      │
│     - Add Stripe credentials                    │
│     - Add SendGrid API key                      │
│     - Configure OAuth providers                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  4. Customize email templates                   │
│     - Welcome email                             │
│     - Password reset                            │
│     - Subscription emails                       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  5. Copy API key                                │
│     fal_abc123xyz                               │
└─────────────────────────────────────────────────┘
```

### End User Experience (Runtime)

```
┌─────────────────────────────────────────────────┐
│  End user visits myapp.com                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Frictionless SDK loaded in browser             │
│  <script src="cdn.frictionless.app/sdk.js">    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  User clicks "Sign Up"                          │
│  SDK shows signup modal (pre-built UI)          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  SDK → POST /api/sdk/auth/signup                │
│  {                                              │
│    email: "user@example.com",                   │
│    password: "***",                             │
│    name: "John Doe"                             │
│  }                                              │
│  Headers: { x-api-key: "fal_abc123" }           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Platform backend:                              │
│  1. Validates API key                           │
│  2. Creates EndUser in database                 │
│  3. Sends welcome email via SendGrid            │
│  4. Emits user.signup event to SmartHooks       │
│  5. Returns session token                       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  SDK stores session, closes modal               │
│  Triggers onStateChange callback                │
│  Developer's app now has authenticated user     │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Security Model

### API Key Authentication

- **Format**: `fal_` prefix + 64 random hex characters
- **Generation**: Created automatically when project is created
- **Usage**: Sent in `Authorization: Bearer fal_xxx` or `x-api-key: fal_xxx` header
- **Validation**: Middleware checks DB, verifies project, logs last usage
- **Scope**: API key grants access to project-specific endpoints only

### Session Management

- **Storage**: HttpOnly cookies + localStorage for refresh tokens
- **Encryption**: JWT tokens signed with project-specific secret
- **Rotation**: Access tokens expire in 15 minutes, refresh tokens in 30 days
- **Revocation**: Stored in database for instant invalidation

### CORS Protection

- **Domain Allowlist**: Projects can specify allowed domains
- **Middleware**: Validates `Origin` header against project.domain
- **Dev Mode**: `localhost` automatically allowed for development

---

## 📦 SDK Package Structure

```
packages/sdk/
├── src/
│   ├── index.ts              # Main export
│   ├── core/
│   │   ├── client.ts         # FrictionlessClient class
│   │   ├── config.ts         # Configuration
│   │   └── http.ts           # API client
│   ├── modules/
│   │   ├── auth.ts           # Authentication module
│   │   ├── payments.ts       # Stripe payments module
│   │   ├── analytics.ts      # Event tracking module
│   │   └── profile.ts        # User profile management
│   ├── ui/
│   │   ├── modal.ts          # Base modal component
│   │   ├── signup.ts         # Signup modal
│   │   ├── login.ts          # Login modal
│   │   └── checkout.ts       # Checkout modal
│   └── types/
│       └── index.ts          # TypeScript types
├── dist/                     # Built files
│   ├── frictionless.js       # UMD bundle
│   ├── frictionless.esm.js   # ESM bundle
│   └── frictionless.d.ts     # TypeScript declarations
├── package.json
├── tsconfig.json
└── vite.config.ts            # Build configuration
```

---

## 🌐 CDN Distribution

### Hosted on Vercel Edge Network

```
https://cdn.frictionless.app/
├── v1/
│   ├── sdk.js              # Latest stable (with auto-init)
│   ├── sdk.min.js          # Minified version
│   └── sdk.esm.js          # ES modules version
├── v1.0.0/
│   └── sdk.js              # Pinned versions
└── beta/
    └── sdk.js              # Beta releases
```

### Auto-Initialization (Script Tag Mode)

```html
<script src="https://cdn.frictionless.app/v1/sdk.js" data-api-key="fal_abc123"></script>

<!-- SDK auto-initializes and exposes global `Frictionless` object -->
<script>
  Frictionless.auth.showSignup()
</script>
```

---

## 🔌 API Endpoints (SDK-Facing)

All SDK endpoints are protected by API key middleware.

### Authentication

```
POST   /api/sdk/auth/signup
POST   /api/sdk/auth/login
POST   /api/sdk/auth/logout
POST   /api/sdk/auth/refresh
POST   /api/sdk/auth/forgot-password
POST   /api/sdk/auth/reset-password
GET    /api/sdk/auth/me
```

### Payments (Stripe Proxy)

```
POST   /api/sdk/payments/create-checkout
POST   /api/sdk/payments/create-customer
GET    /api/sdk/payments/subscription
POST   /api/sdk/payments/cancel-subscription
```

### User Profile

```
GET    /api/sdk/profile
PATCH  /api/sdk/profile
DELETE /api/sdk/profile
```

### Analytics

```
POST   /api/sdk/track
```

---

## 📊 Database Schema (Recap)

### For Developers (Platform Users)

- `User` - Developers who create projects
- `Account` - OAuth accounts (NextAuth)
- `Session` - Developer sessions
- `Project` - Apps built with Frictionless
- `Integration` - Service configurations
- `ApiKey` - SDK authentication keys

### For End Users (App Users)

- `EndUser` - Users of apps built with Frictionless
- `UserActivity` - Event tracking
- `Subscription` - Stripe subscriptions
- `EmailTemplate` - Email templates
- `EmailCampaign` - Marketing campaigns

---

## 🚀 Deployment Strategy

### Platform (Backend)

- **Host**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Domain**: `platform.frictionless.app` or `app.frictionless.app`
- **Regions**: Global edge (Vercel Edge Functions)

### SDK (Frontend)

- **Build**: Vite (produces UMD + ESM bundles)
- **CDN**: Vercel Edge Network
- **Domain**: `cdn.frictionless.app`
- **Versioning**: SemVer (v1.0.0, v1.1.0, etc.)

### Email Delivery

- **Primary**: SendGrid (user-configured)
- **Backup**: Postmark, SMTP
- **Abstraction**: EmailProvider interface

---

## 📈 Roadmap

### Phase 1: Core Platform (Current)
- ✅ Supabase database schema
- ✅ NextAuth.js authentication
- ✅ API key system
- ✅ Email provider abstraction
- ✅ Lightweight CRM
- ✅ Integration management

### Phase 2: SDK Development (Next)
- [ ] Build JavaScript SDK package
- [ ] Pre-built UI components (modals)
- [ ] Auth module (signup, login, OAuth)
- [ ] Payments module (Stripe checkout)
- [ ] Analytics module (event tracking)
- [ ] CDN setup and deployment

### Phase 3: Dashboard UI
- [ ] Project management interface
- [ ] Integration configuration UI
- [ ] Email template editor (visual)
- [ ] CRM dashboard (users, subscriptions)
- [ ] Analytics dashboard
- [ ] Billing (for platform itself)

### Phase 4: Advanced Features
- [ ] 2FA for end users
- [ ] Team collaboration (multi-user projects)
- [ ] Webhooks for developers
- [ ] Custom domain support (white-label)
- [ ] A/B testing for emails
- [ ] Segmentation and campaigns

---

## 💡 Competitive Advantages

| Feature | Frictionless | Firebase Auth | Auth0 | Stripe | SendGrid |
|---------|-------------|---------------|-------|--------|----------|
| **Auth** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Payments** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Emails** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **CRM** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **One SDK** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Pricing** | Simple | Complex | $$$ | % | Per send |

**Key Differentiator**: Everything in ONE SDK with ONE API key.

---

## 🎓 Example: Complete Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>My SaaS App</title>
  <!-- That's it! One line. -->
  <script src="https://cdn.frictionless.app/v1/sdk.js" data-api-key="fal_abc123"></script>
</head>
<body>
  <button id="signup">Sign Up</button>
  <button id="login">Login</button>
  <button id="upgrade">Upgrade to Pro</button>

  <script>
    // Handle signup
    document.getElementById('signup').onclick = async () => {
      await Frictionless.auth.showSignup()
    }

    // Handle login
    document.getElementById('login').onclick = async () => {
      await Frictionless.auth.showLogin()
    }

    // Handle upgrade
    document.getElementById('upgrade').onclick = async () => {
      await Frictionless.payments.checkout({
        priceId: 'price_pro_monthly',
        successUrl: '/welcome',
        cancelUrl: '/pricing'
      })
    }

    // Listen for auth state
    Frictionless.auth.onStateChange((user) => {
      if (user) {
        console.log('Logged in as:', user.email)
        // Automatically tracked as 'user.login' event → SmartHooks
      }
    })
  </script>
</body>
</html>
```

**What happens behind the scenes?**
1. SDK authenticates user
2. Sends welcome email (from your template)
3. Creates Stripe subscription
4. Tracks events to SmartHooks
5. Stores user in your CRM
6. All with ZERO backend code!

---

**Last Updated**: 2025-11-15
**Version**: 0.2.0 (Phase 1 Complete)
