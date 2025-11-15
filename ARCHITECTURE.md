# FrictionlessAuthLayer - Architecture & Design

## 🏗️ System Architecture

### Overview

FrictionlessAuthLayer is designed as a **standalone microservice** that acts as a centralized hub for authentication, payments, email, and CRM integrations. It follows a headless, API-first architecture that can be consumed by any frontend or backend application.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  (Your React App, Mobile App, Backend Services, etc.)       │
└───────────────┬─────────────────────────────────────────────┘
                │ HTTP/REST API
                ▼
┌─────────────────────────────────────────────────────────────┐
│              FrictionlessAuthLayer Platform                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Next.js Application Layer                 │    │
│  │                                                     │    │
│  │  ┌──────────────┐         ┌──────────────┐        │    │
│  │  │ Dashboard UI │         │  Public API   │        │    │
│  │  │ (React/Next) │         │   Endpoints   │        │    │
│  │  └──────────────┘         └──────────────┘        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │            Business Logic Layer                     │    │
│  │                                                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │    │
│  │  │ Integration │  │   Webhook   │  │    ENV    │ │    │
│  │  │   Manager   │  │   Handler   │  │ Generator │ │    │
│  │  └─────────────┘  └─────────────┘  └───────────┘ │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Integration Services Layer                │    │
│  │                                                     │    │
│  │  ┌───────┐ ┌──────────┐ ┌──────┐ ┌─────────┐     │    │
│  │  │Stripe │ │SendGrid  │ │OAuth │ │  CRMs   │     │    │
│  │  │Client │ │ Client   │ │Flows │ │(HubSpot)│ ... │    │
│  │  └───────┘ └──────────┘ └──────┘ └─────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Data Access Layer                      │    │
│  │                                                     │    │
│  │  ┌─────────────────┐       ┌──────────────┐       │    │
│  │  │ Prisma ORM      │       │   Crypto     │       │    │
│  │  │ (SQLite/PG)     │       │  Utilities   │       │    │
│  │  └─────────────────┘       └──────────────┘       │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │ Signed Webhooks (HMAC-SHA256)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Vantrakticks SmartHooks Platform                     │
│      https://smarthooks.vantrakticks.com/api/event          │
│                                                              │
│  - Event Registry & Delivery Engine                         │
│  - Workflow Automation                                      │
│  - Campaign Triggers                                        │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Model

### Core Entities

#### Account
```typescript
model Account {
  id           String      @id @default(cuid())
  email        String      @unique
  name         String?
  integrations Integration[]
  projects     Project[]
}
```
Represents a user/organization managing the platform.

#### Project
```typescript
model Project {
  id           String        @id @default(cuid())
  name         String
  slug         String        @unique
  webhookUrl   String?
  account      Account       @relation(...)
  integrations Integration[]
  envConfigs   EnvConfig[]
  authFlows    AuthFlow[]
}
```
Represents an application using FrictionlessAuthLayer. Each project has its own set of integrations and configurations.

#### Integration
```typescript
model Integration {
  id          String   @id @default(cuid())
  type        String   // 'stripe', 'sendgrid', etc.
  name        String
  enabled     Boolean
  credentials String   // Encrypted JSON
  config      String?  // Additional config
  project     Project  @relation(...)
}
```
Stores encrypted credentials for third-party services.

### Security Design

#### Credential Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: From `AUTH_SECRET` environment variable
- **Storage**: Credentials are encrypted before database insertion
- **Decryption**: Only happens at runtime when needed

```typescript
// Encryption flow
const encryptedCreds = encrypt(JSON.stringify(credentials))
await prisma.integration.create({
  data: { credentials: encryptedCreds }
})

// Decryption flow (only when needed)
const integration = await prisma.integration.findUnique(...)
const credentials = JSON.parse(decrypt(integration.credentials))
```

#### Webhook Signatures
- **Algorithm**: HMAC-SHA256
- **Purpose**: Verify webhook authenticity when sending to SmartHooks
- **Implementation**:

```typescript
const signature = createHmac('sha256', secret)
  .update(payload)
  .digest('hex')
```

## 🔌 Integration Architecture

### Plugin Pattern

Each integration follows a consistent pattern:

```typescript
export class IntegrationClient {
  private credentials: Credentials
  private client: ServiceSDK

  // Initialize from project
  static async fromProject(projectId: string): Promise<IntegrationClient>

  // Core methods
  async doAction(params): Promise<Result>

  // Webhook handling
  verifyWebhook(payload, signature): Event
  handleWebhookEvent(event): Promise<Result>
}
```

### Supported Integrations

| Category | Service | Status | Features |
|----------|---------|--------|----------|
| **Payment** | Stripe | ✅ Complete | Checkout, Subscriptions, Webhooks |
| **Email** | SendGrid | ✅ Complete | Transactional, Templates, Bulk |
| **Auth** | Google OAuth | ✅ Complete | OAuth flow, credential management |
| **Auth** | GitHub OAuth | ✅ Complete | OAuth flow, credential management |
| **CRM** | HubSpot | 🔧 Config Only | Contact sync (implementation pending) |
| **CRM** | Salesforce | 🔧 Config Only | Lead sync (implementation pending) |
| **Marketing** | Mailchimp | 🔧 Config Only | Audience management (pending) |

### Adding New Integrations

To add a new integration:

1. **Define configuration** in `src/config/integrations.ts`:

```typescript
export const INTEGRATIONS = {
  // ...existing,
  new_service: {
    type: 'new_service',
    name: 'New Service',
    category: 'category',
    requiredCredentials: [
      { key: 'api_key', label: 'API Key', type: 'password' }
    ]
  }
}
```

2. **Create integration module** in `src/lib/integrations/new-service.ts`:

```typescript
export class NewServiceIntegration {
  static async fromProject(projectId: string) { ... }
  async doSomething() { ... }
}
```

3. **Update ENV generator** in `src/app/api/env/generate/route.ts`
4. **Update snippet generator** in `src/app/api/snippets/generate/route.ts`

## 🔄 Event Flow (SmartHooks Integration)

### Event Types

```typescript
type SmartHooksEventType =
  | 'user.signup'
  | 'user.login'
  | 'user.email_verified'
  | 'user.account_updated'
  | 'user.password_reset'
  | 'payment.subscription_created'
  | 'payment.subscription_updated'
  | 'payment.subscription_cancelled'
  | 'profile.business_completed'
  | 'team.member_invited'
  | 'team.member_joined'
```

### Event Emission Flow

```
User Action → Your App → emitEvent() → SmartHooks Platform
                              │
                              ├─ Generate signature
                              ├─ Log to database
                              ├─ Send POST request
                              └─ Handle retry on failure
```

### Retry Strategy

- **Strategy**: Exponential backoff
- **Max Retries**: 3
- **Delays**: 1s, 2s, 4s, 8s
- **Logging**: All attempts logged to `WebhookEvent` table

```typescript
const client = new SmartHooksClient({
  retryStrategy: 'exponential_backoff',
  maxRetries: 3
})
```

## 📋 Form Template System

### Template Structure

```typescript
interface FormTemplate {
  id: string
  name: string
  category: 'auth' | 'payment' | 'profile' | 'business'
  fields: FormField[]
  submitButton: string
  successMessage: string
  eventType: SmartHooksEventType
}
```

### Pre-built Templates

1. **Email & Password Signup** → Triggers `user.signup`
2. **Stripe Payment Setup** → Triggers `payment.subscription_created`
3. **Business Profile** → Triggers `profile.business_completed`
4. **OAuth Social** → Triggers `user.oauth_signup`
5. **Team Invite** → Triggers `team.member_invited`

### Extension Pattern

Templates can be extended with custom fields:

```typescript
const template = FORM_TEMPLATES['email-password-signup']
const customFields = [
  { id: 'company', type: 'text', label: 'Company Name' }
]

const extendedTemplate = {
  ...template,
  fields: [...template.fields, ...customFields]
}
```

## 🚀 Deployment Architecture

### Recommended Setup

```
┌─────────────────────────────────────────────────────┐
│               Production Environment                 │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Vercel / AWS / DigitalOcean / Railway     │    │
│  │                                             │    │
│  │  ┌──────────────────────────────────────┐  │    │
│  │  │  Next.js App (FrictionlessAuthLayer) │  │    │
│  │  └──────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Database (PostgreSQL / PlanetScale)       │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Environment Variables (Encrypted)         │    │
│  │  - AUTH_SECRET                             │    │
│  │  - DATABASE_URL                            │    │
│  │  - SMARTHOOKS_API_KEY                      │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Environment-Specific Configuration

| Environment | Database | Encryption | Webhooks |
|-------------|----------|------------|----------|
| **Development** | SQLite | Basic secret | Localhost |
| **Staging** | PostgreSQL | Rotated secret | Staging URL |
| **Production** | PostgreSQL | HSM/Vault | Production URL |

## 🔧 Configuration Management

### Environment Variable Hierarchy

1. **System-level** (FrictionlessAuthLayer itself)
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `SMARTHOOKS_WEBHOOK_URL`
   - `SMARTHOOKS_API_KEY`

2. **Project-level** (Generated for client apps)
   - `STRIPE_SECRET_KEY`
   - `SENDGRID_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - etc.

### ENV Generation Process

```typescript
// Client requests ENV file
GET /api/env/generate?projectId=xxx

// Server flow:
1. Fetch project + integrations
2. Decrypt credentials
3. Build ENV file content
4. Return as downloadable file
```

## 📈 Scalability Considerations

### Current Limitations

- **SQLite**: Single-file database, not suitable for multi-instance deployments
- **In-memory retry**: Webhook retries are process-bound

### Future Enhancements

1. **Multi-tenancy**: Add `organizationId` to all models
2. **Background Jobs**: Use BullMQ/Inngest for webhook delivery
3. **Caching**: Redis for integration credentials
4. **Rate Limiting**: Per-project API rate limits
5. **Monitoring**: OpenTelemetry integration

### Recommended Production Stack

```
Frontend: Next.js (Vercel)
Database: PostgreSQL (Supabase/Railway)
Queue: BullMQ + Redis (Upstash)
Monitoring: Sentry + Axiom
Secrets: Vault / AWS Secrets Manager
```

## 🔐 Security Best Practices

1. **Credential Storage**
   - Always encrypt before storage
   - Use separate encryption keys per environment
   - Rotate `AUTH_SECRET` every 90 days

2. **API Security**
   - Add authentication middleware (NextAuth.js recommended)
   - Implement rate limiting
   - Validate all inputs with Zod schemas

3. **Webhook Security**
   - Always verify HMAC signatures
   - Use HTTPS in production
   - Implement replay attack protection

4. **Database Security**
   - Enable SSL connections
   - Use read replicas for queries
   - Regular backups

## 📚 Next Steps

### Immediate (Week 1-2)
- [ ] Build Dashboard UI for project/integration management
- [ ] Add authentication (NextAuth.js)
- [ ] Implement OAuth flow handlers
- [ ] Create demo onboarding flows

### Short-term (Month 1)
- [ ] Form builder component
- [ ] Email template editor
- [ ] HubSpot integration implementation
- [ ] Webhook event viewer dashboard

### Long-term (Quarter 1)
- [ ] Multi-tenancy support
- [ ] Background job queue
- [ ] Analytics dashboard
- [ ] API rate limiting
- [ ] White-label options

---

**Last Updated**: 2025-11-15
**Version**: 0.1.0
