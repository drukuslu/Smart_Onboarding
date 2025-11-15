/**
 * Stripe Integration Module
 */

import Stripe from 'stripe'
import { decrypt } from '../utils/crypto'
import { prisma } from '../prisma'

export interface StripeCredentials {
  secret_key: string
  publishable_key: string
  webhook_secret: string
}

export class StripeIntegration {
  private stripe: Stripe | null = null
  private credentials: StripeCredentials | null = null

  constructor(credentials?: StripeCredentials) {
    if (credentials) {
      this.credentials = credentials
      this.stripe = new Stripe(credentials.secret_key, {
        apiVersion: '2024-12-18.acacia'
      })
    }
  }

  /**
   * Initialize from project integration
   */
  static async fromProject(projectId: string): Promise<StripeIntegration> {
    const integration = await prisma.integration.findUnique({
      where: {
        projectId_type: {
          projectId,
          type: 'stripe'
        }
      }
    })

    if (!integration || !integration.enabled) {
      throw new Error('Stripe integration not found or not enabled')
    }

    const credentials = JSON.parse(decrypt(integration.credentials)) as StripeCredentials

    return new StripeIntegration(credentials)
  }

  /**
   * Get Stripe client
   */
  getClient(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe client not initialized')
    }
    return this.stripe
  }

  /**
   * Auto-fetch product IDs from Stripe
   */
  async fetchProducts(): Promise<Stripe.Product[]> {
    const stripe = this.getClient()
    const products = await stripe.products.list({ active: true, limit: 100 })
    return products.data
  }

  /**
   * Auto-fetch price IDs for products
   */
  async fetchPrices(productId?: string): Promise<Stripe.Price[]> {
    const stripe = this.getClient()
    const params: Stripe.PriceListParams = { active: true, limit: 100 }

    if (productId) {
      params.product = productId
    }

    const prices = await stripe.prices.list(params)
    return prices.data
  }

  /**
   * Create a checkout session
   */
  async createCheckoutSession(params: {
    priceId: string
    successUrl: string
    cancelUrl: string
    customerEmail?: string
    metadata?: Record<string, string>
  }): Promise<Stripe.Checkout.Session> {
    const stripe = this.getClient()

    return stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: params.priceId,
          quantity: 1
        }
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      metadata: params.metadata
    })
  }

  /**
   * Create a customer
   */
  async createCustomer(params: {
    email: string
    name?: string
    metadata?: Record<string, string>
  }): Promise<Stripe.Customer> {
    const stripe = this.getClient()

    return stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata
    })
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string, signature: string): Stripe.Event {
    if (!this.credentials) {
      throw new Error('Stripe credentials not initialized')
    }

    const stripe = this.getClient()

    return stripe.webhooks.constructEvent(
      payload,
      signature,
      this.credentials.webhook_secret
    )
  }

  /**
   * Handle webhook event
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<{ handled: boolean; action?: string }> {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        // Handle successful checkout
        return { handled: true, action: 'checkout_completed' }

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription
        // Handle subscription created
        return { handled: true, action: 'subscription_created' }

      case 'customer.subscription.updated':
        // Handle subscription updated
        return { handled: true, action: 'subscription_updated' }

      case 'customer.subscription.deleted':
        // Handle subscription cancelled
        return { handled: true, action: 'subscription_cancelled' }

      default:
        return { handled: false }
    }
  }
}
