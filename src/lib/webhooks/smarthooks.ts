/**
 * SmartHooks Integration Client
 * Emits events to the Vantrakticks SmartHooks platform
 */

import { generateSignature } from '../utils/crypto'
import { prisma } from '../prisma'

export type SmartHooksEventType =
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

export interface SmartHooksEvent {
  eventType: SmartHooksEventType
  timestamp: string
  projectId: string
  userId?: string
  data: Record<string, any>
  metadata?: Record<string, any>
}

export interface SmartHooksConfig {
  webhookUrl: string
  apiKey: string
  retryStrategy?: 'none' | 'linear' | 'exponential_backoff'
  maxRetries?: number
}

export class SmartHooksClient {
  private config: SmartHooksConfig

  constructor(config?: Partial<SmartHooksConfig>) {
    this.config = {
      webhookUrl: process.env.SMARTHOOKS_WEBHOOK_URL || 'https://smarthooks.vantrakticks.com/api/event',
      apiKey: process.env.SMARTHOOKS_API_KEY || '',
      retryStrategy: 'exponential_backoff',
      maxRetries: 3,
      ...config
    }
  }

  /**
   * Emit an event to SmartHooks
   */
  async emit(event: SmartHooksEvent): Promise<{ success: boolean; webhookEventId?: string; error?: string }> {
    const payload = JSON.stringify({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      source: 'FrictionlessAuthLayer',
      version: '1.0'
    })

    // Generate HMAC-SHA256 signature
    const signature = generateSignature(payload, this.config.apiKey)

    // Log webhook event to database
    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        eventType: event.eventType,
        payload,
        signature,
        status: 'pending',
        projectId: event.projectId
      }
    })

    try {
      const response = await this.sendWithRetry(payload, signature, webhookEvent.id)

      // Update webhook event status
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: 'sent',
          response: JSON.stringify({
            status: response.status,
            data: response.data
          })
        }
      })

      return { success: true, webhookEventId: webhookEvent.id }
    } catch (error: any) {
      // Update webhook event with failure
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: 'failed',
          response: JSON.stringify({
            error: error.message,
            details: error.response?.data
          })
        }
      })

      return {
        success: false,
        webhookEventId: webhookEvent.id,
        error: error.message
      }
    }
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWithRetry(
    payload: string,
    signature: string,
    webhookEventId: string,
    attempt: number = 0
  ): Promise<any> {
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SmartHooks-Signature': signature,
          'X-SmartHooks-Event-ID': webhookEventId,
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: payload
      })

      if (!response.ok) {
        throw new Error(`SmartHooks returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return { status: response.status, data }
    } catch (error: any) {
      // Retry logic
      if (this.config.retryStrategy !== 'none' && attempt < (this.config.maxRetries || 3)) {
        const delay = this.calculateRetryDelay(attempt)
        await this.sleep(delay)
        return this.sendWithRetry(payload, signature, webhookEventId, attempt + 1)
      }

      throw error
    }
  }

  /**
   * Calculate retry delay based on strategy
   */
  private calculateRetryDelay(attempt: number): number {
    if (this.config.retryStrategy === 'exponential_backoff') {
      // 1s, 2s, 4s, 8s...
      return Math.pow(2, attempt) * 1000
    }

    // Linear: 2s each time
    return 2000
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Batch emit multiple events
   */
  async emitBatch(events: SmartHooksEvent[]): Promise<{ success: boolean; results: any[] }> {
    const results = await Promise.allSettled(
      events.map(event => this.emit(event))
    )

    const allSuccessful = results.every(r => r.status === 'fulfilled' && r.value.success)

    return {
      success: allSuccessful,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'rejected' })
    }
  }
}

// Singleton instance
let smarthooksClient: SmartHooksClient | null = null

export function getSmartHooksClient(): SmartHooksClient {
  if (!smarthooksClient) {
    smarthooksClient = new SmartHooksClient()
  }
  return smarthooksClient
}

/**
 * Helper function to emit events easily
 */
export async function emitEvent(
  eventType: SmartHooksEventType,
  projectId: string,
  data: Record<string, any>,
  userId?: string
): Promise<{ success: boolean; webhookEventId?: string; error?: string }> {
  const client = getSmartHooksClient()
  return client.emit({
    eventType,
    timestamp: new Date().toISOString(),
    projectId,
    userId,
    data
  })
}
