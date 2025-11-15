/**
 * SendGrid Integration Module
 */

import sgMail from '@sendgrid/mail'
import { decrypt } from '../utils/crypto'
import { prisma } from '../prisma'

export interface SendGridCredentials {
  api_key: string
  from_email: string
  from_name?: string
}

export interface EmailTemplate {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  templateId?: string
  dynamicTemplateData?: Record<string, any>
}

export class SendGridIntegration {
  private credentials: SendGridCredentials | null = null
  private initialized = false

  constructor(credentials?: SendGridCredentials) {
    if (credentials) {
      this.credentials = credentials
      this.initialize()
    }
  }

  /**
   * Initialize from project integration
   */
  static async fromProject(projectId: string): Promise<SendGridIntegration> {
    const integration = await prisma.integration.findUnique({
      where: {
        projectId_type: {
          projectId,
          type: 'sendgrid'
        }
      }
    })

    if (!integration || !integration.enabled) {
      throw new Error('SendGrid integration not found or not enabled')
    }

    const credentials = JSON.parse(decrypt(integration.credentials)) as SendGridCredentials

    return new SendGridIntegration(credentials)
  }

  /**
   * Initialize SendGrid client
   */
  private initialize() {
    if (!this.credentials) {
      throw new Error('SendGrid credentials not provided')
    }

    sgMail.setApiKey(this.credentials.api_key)
    this.initialized = true
  }

  /**
   * Send a single email
   */
  async sendEmail(template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.initialized || !this.credentials) {
      throw new Error('SendGrid not initialized')
    }

    try {
      const msg: any = {
        to: template.to,
        from: {
          email: this.credentials.from_email,
          name: this.credentials.from_name || 'Your App'
        },
        subject: template.subject
      }

      // Use template ID if provided, otherwise use text/html
      if (template.templateId) {
        msg.templateId = template.templateId
        msg.dynamicTemplateData = template.dynamicTemplateData || {}
      } else {
        if (template.html) {
          msg.html = template.html
        }
        if (template.text) {
          msg.text = template.text
        }
      }

      const response = await sgMail.send(msg)

      return {
        success: true,
        messageId: response[0].headers['x-message-id'] as string
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(params: {
    to: string
    name: string
    verificationUrl?: string
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: params.to,
      subject: 'Welcome! Verify your email',
      html: `
        <h1>Welcome, ${params.name}!</h1>
        <p>Thanks for signing up. We're excited to have you on board.</p>
        ${params.verificationUrl ? `
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${params.verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
            Verify Email
          </a>
        ` : ''}
        <p>Best regards,<br/>The Team</p>
      `,
      text: `Welcome, ${params.name}! Thanks for signing up. ${params.verificationUrl ? `Verify your email: ${params.verificationUrl}` : ''}`
    })
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(params: {
    to: string
    name: string
    resetUrl: string
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: params.to,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${params.name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <a href="${params.resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
          Reset Password
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `,
      text: `Password reset requested. Reset your password: ${params.resetUrl}`
    })
  }

  /**
   * Send team invitation email
   */
  async sendTeamInviteEmail(params: {
    to: string
    inviterName: string
    projectName: string
    inviteUrl: string
    role: string
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: params.to,
      subject: `You've been invited to join ${params.projectName}`,
      html: `
        <h1>Team Invitation</h1>
        <p>${params.inviterName} has invited you to join <strong>${params.projectName}</strong> as a ${params.role}.</p>
        <a href="${params.inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
          Accept Invitation
        </a>
      `,
      text: `${params.inviterName} invited you to join ${params.projectName}. Accept: ${params.inviteUrl}`
    })
  }

  /**
   * Send bulk emails (e.g., for campaigns)
   */
  async sendBulk(emails: EmailTemplate[]): Promise<{ success: boolean; sent: number; failed: number }> {
    if (!this.initialized) {
      throw new Error('SendGrid not initialized')
    }

    const results = await Promise.allSettled(
      emails.map(email => this.sendEmail(email))
    )

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - sent

    return {
      success: failed === 0,
      sent,
      failed
    }
  }
}
