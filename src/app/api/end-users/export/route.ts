import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/end-users/export?projectId=xxx&format=csv|json
 * Export end users for HubSpot, Salesforce, etc.
 */
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')
    const format = req.nextUrl.searchParams.get('format') || 'csv'
    const status = req.nextUrl.searchParams.get('status')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    const where: any = { projectId }

    if (status) {
      where.subscriptionStatus = status
    }

    const endUsers = await prisma.endUser.findMany({
      where,
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (format === 'json') {
      return NextResponse.json({ endUsers })
    }

    // CSV Export (compatible with HubSpot, Salesforce)
    const csvHeaders = [
      'Email',
      'First Name',
      'Last Name',
      'Email Verified',
      'Signup Date',
      'Last Login',
      'Subscription Status',
      'Stripe Customer ID',
      'Signup Source',
      'Metadata'
    ].join(',')

    const csvRows = endUsers.map(user => {
      const nameParts = user.name?.split(' ') || ['', '']
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      return [
        user.email,
        firstName,
        lastName,
        user.emailVerified ? 'Yes' : 'No',
        user.createdAt.toISOString(),
        user.lastLoginAt?.toISOString() || '',
        user.subscriptionStatus || '',
        user.stripeCustomerId || '',
        user.signupSource || '',
        user.metadata || ''
      ].map(field => `"${field}"`).join(',')
    })

    const csv = [csvHeaders, ...csvRows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
