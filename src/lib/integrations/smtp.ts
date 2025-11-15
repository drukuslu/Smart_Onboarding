/**
 * SMTP Integration Module
 * Supports custom SMTP servers and AWS SES
 */

import nodemailer from 'nodemailer'
import { decrypt } from '../utils/crypto'
import { prisma } from '../prisma'
import { EmailProvider, EmailMessage, EmailResult } from './email-provider'

export interface SMTPCredentials {
  host: string
  port: number
  secure: boolean // true for 465, false for other ports
  auth: {
    user: string
    pass: string
  }
  from_email: string
  from_name?: string
}

export class SMTPIntegration extends EmailProvider {
  private transporter: nodemailer.Transporter | null = null
  private credentials: SMTPCredentials | null = null

  constructor(credentials?: SMTPCredentials) {
    super()
    if (credentials) {
      this.credentials = credentials
      this.transporter = nodemailer.createTransporter({
        host: credentials.host,
        port: credentials.port,
        secure: credentials.secure,
        auth: credentials.auth
      })
    }
  }

  /**
   * Initialize from project integration
   */
  static async fromProject(projectId: string): Promise<SMTPIntegration> {
    const integration = await prisma.integration.findUnique({
      where: {
        projectId_type: {
          projectId,
          type: 'smtp'
        }
      }
    })

    if (!integration || !integration.enabled) {
      throw new Error('SMTP integration not found or not enabled')
    }

    const credentials = JSON.parse(decrypt(integration.credentials)) as SMTPCredentials

    return new SMTPIntegration(credentials)
  }

  /**
   * Send a single email
   */
  async send(message: EmailMessage): Promise<EmailResult> {
    if (!this.transporter || !this.credentials) {
      throw new Error('SMTP transporter not initialized')
    }

    try {
      const info = await this.transporter.sendMail({
        from: message.from || `${this.credentials.from_name || 'Your App'} <${this.credentials.from_email}>`,
        to: Array.isArray(message.to) ? message.to.join(',') : message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments
      })

      return {
        success: true,
        messageId: info.messageId
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
    const results = await Promise.allSettled(
      messages.map(msg => this.send(msg))
    )

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - sent

    return {
      success: failed === 0,
      sent,
      failed
    }
  }

  /**
   * Verify SMTP connection
   */
  async verify(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('SMTP transporter not initialized')
    }

    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      return false
    }
  }
}
