/**
 * Email Provider Abstraction Layer
 * Supports: SendGrid, Postmark, AWS SES (via Nodemailer), SMTP
 */

import { SendGridIntegration } from './sendgrid'
import { PostmarkIntegration } from './postmark'
import { SMTPIntegration } from './smtp'
import { prisma } from '../prisma'

export type EmailProviderType = 'sendgrid' | 'postmark' | 'smtp' | 'aws-ses'

export interface EmailMessage {
  to: string | string[]
  from?: string
  subject: string
  html?: string
  text?: string
  templateId?: string
  templateData?: Record<string, any>
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface EmailStats {
  sent: number
  opened?: number
  clicked?: number
  bounced?: number
  complained?: number
}

export abstract class EmailProvider {
  abstract send(message: EmailMessage): Promise<EmailResult>
  abstract sendBatch(messages: EmailMessage[]): Promise<{ success: boolean; sent: number; failed: number }>
  abstract getStats?(startDate: Date, endDate: Date): Promise<EmailStats>
}

/**
 * Email Provider Factory
 * Automatically selects the right provider based on project integrations
 */
export class EmailProviderFactory {
  static async fromProject(projectId: string): Promise<EmailProvider> {
    // Check for SendGrid integration
    const sendgrid = await prisma.integration.findUnique({
      where: {
        projectId_type: {
          projectId,
          type: 'sendgrid'
        }
      }
    })

    if (sendgrid && sendgrid.enabled) {
      return await SendGridIntegration.fromProject(projectId)
    }

    // Check for Postmark integration
    const postmark = await prisma.integration.findUnique({
      where: {
        projectId_type: {
          projectId,
          type: 'postmark'
        }
      }
    })

    if (postmark && postmark.enabled) {
      return await PostmarkIntegration.fromProject(projectId)
    }

    // Check for SMTP integration
    const smtp = await prisma.integration.findUnique({
      where: {
        projectId_type: {
          projectId,
          type: 'smtp'
        }
      }
    })

    if (smtp && smtp.enabled) {
      return await SMTPIntegration.fromProject(projectId)
    }

    throw new Error('No email provider configured for this project')
  }

  static async create(
    type: EmailProviderType,
    credentials: Record<string, any>
  ): Promise<EmailProvider> {
    switch (type) {
      case 'sendgrid':
        return new SendGridIntegration(credentials)
      case 'postmark':
        return new PostmarkIntegration(credentials)
      case 'smtp':
      case 'aws-ses':
        return new SMTPIntegration(credentials)
      default:
        throw new Error(`Unsupported email provider: ${type}`)
    }
  }
}

/**
 * Helper function to send templated emails
 */
export async function sendTemplatedEmail(
  projectId: string,
  templateCategory: string,
  to: string,
  variables: Record<string, any>
): Promise<EmailResult> {
  // Get email template
  const template = await prisma.emailTemplate.findFirst({
    where: {
      projectId,
      category: templateCategory
    }
  })

  if (!template) {
    return {
      success: false,
      error: `Email template not found: ${templateCategory}`
    }
  }

  // Replace variables in template
  let html = template.htmlContent
  let text = template.textContent || ''
  let subject = template.subject

  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`
    html = html.replace(new RegExp(placeholder, 'g'), variables[key])
    text = text.replace(new RegExp(placeholder, 'g'), variables[key])
    subject = subject.replace(new RegExp(placeholder, 'g'), variables[key])
  })

  // Get email provider
  const provider = await EmailProviderFactory.fromProject(projectId)

  // Send email
  return provider.send({
    to,
    subject,
    html,
    text
  })
}

/**
 * Send transactional email (welcome, password reset, etc.)
 */
export async function sendTransactionalEmail(
  projectId: string,
  type: 'welcome' | 'password_reset' | 'email_verification' | 'cancellation',
  params: {
    to: string
    name?: string
    url?: string
    [key: string]: any
  }
): Promise<EmailResult> {
  const variables = {
    userName: params.name || 'there',
    verifyUrl: params.url || '',
    resetUrl: params.url || '',
    ...params
  }

  return sendTemplatedEmail(projectId, type, params.to, variables)
}
