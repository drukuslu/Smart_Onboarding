import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/snippets/generate?projectId=xxx&type=xxx
 * Generate code snippets for integration
 */
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')
    const type = req.nextUrl.searchParams.get('type') || 'all'

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        integrations: {
          where: { enabled: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const snippets: Record<string, string> = {}

    // Stripe snippet
    if (type === 'all' || type === 'stripe') {
      const hasStripe = project.integrations.some(i => i.type === 'stripe')
      if (hasStripe) {
        snippets.stripe = generateStripeSnippet(project.id)
      }
    }

    // SendGrid snippet
    if (type === 'all' || type === 'sendgrid') {
      const hasSendGrid = project.integrations.some(i => i.type === 'sendgrid')
      if (hasSendGrid) {
        snippets.sendgrid = generateSendGridSnippet(project.id)
      }
    }

    // Auth flow snippet
    if (type === 'all' || type === 'auth') {
      snippets.auth = generateAuthSnippet(project.id)
    }

    return NextResponse.json({ snippets })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function generateStripeSnippet(projectId: string): string {
  return `// Stripe Integration - Copy and paste into your app
import { StripeIntegration } from '@/lib/integrations/stripe'

async function createCheckout() {
  const stripe = await StripeIntegration.fromProject('${projectId}')

  const session = await stripe.createCheckoutSession({
    priceId: 'price_xxx', // Your Stripe price ID
    successUrl: 'https://yourapp.com/success',
    cancelUrl: 'https://yourapp.com/cancel',
    customerEmail: 'user@example.com'
  })

  // Redirect to Stripe Checkout
  window.location.href = session.url
}

// Handle webhook events
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const stripe = await StripeIntegration.fromProject('${projectId}')
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  const event = stripe.verifyWebhook(body, signature)
  const result = await stripe.handleWebhookEvent(event)

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
`
}

function generateSendGridSnippet(projectId: string): string {
  return `// SendGrid Integration - Copy and paste into your app
import { SendGridIntegration } from '@/lib/integrations/sendgrid'

async function sendWelcomeEmail(userEmail: string, userName: string) {
  const sendgrid = await SendGridIntegration.fromProject('${projectId}')

  const result = await sendgrid.sendWelcomeEmail({
    to: userEmail,
    name: userName,
    verificationUrl: 'https://yourapp.com/verify?token=xxx'
  })

  if (result.success) {
    console.log('Email sent!', result.messageId)
  } else {
    console.error('Email failed:', result.error)
  }
}

// Send custom email
async function sendCustomEmail() {
  const sendgrid = await SendGridIntegration.fromProject('${projectId}')

  await sendgrid.sendEmail({
    to: 'user@example.com',
    subject: 'Your Subject',
    html: '<h1>Hello!</h1><p>Your content here</p>',
    text: 'Hello! Your content here'
  })
}
`
}

function generateAuthSnippet(projectId: string): string {
  return `// Authentication Flow - Copy and paste into your app
import { emitEvent } from '@/lib/webhooks/smarthooks'

async function handleUserSignup(userData: any) {
  // Your signup logic here
  const user = await createUser(userData)

  // Emit event to SmartHooks
  await emitEvent(
    'user.signup',
    '${projectId}',
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      signupMethod: 'email'
    },
    user.id
  )

  // Send welcome email
  const sendgrid = await SendGridIntegration.fromProject('${projectId}')
  await sendgrid.sendWelcomeEmail({
    to: user.email,
    name: user.name
  })

  return user
}

// Handle login
async function handleUserLogin(email: string) {
  const user = await findUser(email)

  await emitEvent(
    'user.login',
    '${projectId}',
    {
      userId: user.id,
      email: user.email,
      loginMethod: 'email',
      timestamp: new Date().toISOString()
    },
    user.id
  )

  return user
}
`
}
