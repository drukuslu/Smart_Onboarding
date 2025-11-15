/**
 * Postmark Integration Module
 * Excellent for transactional emails with great deliverability
 */

import * as postmark from 'postmark'
import { decrypt } from '../utils/crypto'
import { prisma } from '../prisma'
import { EmailProvider, EmailMessage, EmailResult } from './email-provider'

export interface PostmarkCredentials {
  server_token: string
  from_email: string
  from_name?: string
}

export class PostmarkIntegration extends EmailProvider {
  private client: postmark.ServerClient | null = null
  private credentials: PostmarkCredentials | null = null

  constructor(credentials?: PostmarkCredentials) {
    super()
    if (credentials) {
      this.credentials = credentials
      this.client = new postmark.ServerClient(credentials.server_token)
    }
  }

  /**
   * Initialize from project integration
   */
  static async fromProject(projectId: string): Promise<PostmarkIntegration> {
    const integration = await prisma.integration.findUnique({
      where: {
        projectId_type: {
          projectId,
          type: 'postmark'
        }
      }
    })

    if (!integration || !integration.enabled) {
      throw new Error('Postmark integration not found or not enabled')
    }

    const credentials = JSON.parse(decrypt(integration.credentials)) as PostmarkCredentials

    return new PostmarkIntegration(credentials)
  }

  /**
   * Send a single email
   */
  async send(message: EmailMessage): Promise<EmailResult> {
    if (!this.client || !this.credentials) {
      throw new Error('Postmark client not initialized')
    }

    try {
      const result = await this.client.sendEmail({
        From: message.from || `${this.credentials.from_name || 'Your App'} <${this.credentials.from_email}>`,
        To: Array.isArray(message.to) ? message.to.join(',') : message.to,
        Subject: message.subject,
        HtmlBody: message.html,
        TextBody: message.text,
        ...(message.templateId && {
          TemplateId: parseInt(message.templateId),
          TemplateModel: message.templateData
        }),
        MessageStream: 'outbound'
      })

      return {
        success: true,
        messageId: result.MessageID
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Send bulk emails
   */
  async sendBatch(messages: EmailMessage[]): Promise<{ success: boolean; sent: number; failed: number }> {
    if (!this.client || !this.credentials) {
      throw new Error('Postmark client not initialized')
    }

    try {
      const batch = messages.map(msg => ({
        From: msg.from || `${this.credentials!.from_name || 'Your App'} <${this.credentials!.from_email}>`,
        To: Array.isArray(msg.to) ? msg.to.join(',') : msg.to,
        Subject: msg.subject,
        HtmlBody: msg.html,
        TextBody: msg.text,
        MessageStream: 'outbound'
      }))

      const results = await this.client.sendEmailBatch(batch)

      const sent = results.filter(r => r.ErrorCode === 0).length
      const failed = results.length - sent

      return {
        success: failed === 0,
        sent,
        failed
      }
    } catch (error: any) {
      return {
        success: false,
        sent: 0,
        failed: messages.length
      }
    }
  }

  /**
   * Get email statistics
   */
  async getStats(startDate: Date, endDate: Date) {
    if (!this.client) {
      throw new Error('Postmark client not initialized')
    }

    const stats = await this.client.getOutboundStats({
      fromdate: startDate.toISOString().split('T')[0],
      todate: endDate.toISOString().split('T')[0]
    })

    return {
      sent: stats.Sent,
      opened: stats.UniqueOpens,
      clicked: stats.UniqueLinksClicked,
      bounced: stats.Bounced,
      complained: stats.SpamComplaints
    }
  }
}
