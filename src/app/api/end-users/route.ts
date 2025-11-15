import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/end-users?projectId=xxx
 * List end users (lightweight CRM)
 */
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')
    const status = req.nextUrl.searchParams.get('status')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    const where: any = { projectId }

    if (status) {
      where.subscriptionStatus = status
    }

    const [endUsers, total] = await Promise.all([
      prisma.endUser.findMany({
        where,
        include: {
          subscriptions: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          _count: {
            select: {
              activities: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.endUser.count({ where })
    ])

    return NextResponse.json({
      endUsers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/end-users
 * Create or update an end user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      projectId,
      email,
      name,
      emailVerified,
      avatarUrl,
      metadata,
      stripeCustomerId,
      subscriptionStatus,
      signupSource
    } = body

    if (!projectId || !email) {
      return NextResponse.json(
        { error: 'projectId and email are required' },
        { status: 400 }
      )
    }

    // Upsert end user
    const endUser = await prisma.endUser.upsert({
      where: {
        projectId_email: {
          projectId,
          email
        }
      },
      update: {
        ...(name !== undefined && { name }),
        ...(emailVerified !== undefined && { emailVerified }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(metadata !== undefined && { metadata: JSON.stringify(metadata) }),
        ...(stripeCustomerId !== undefined && { stripeCustomerId }),
        ...(subscriptionStatus !== undefined && { subscriptionStatus })
      },
      create: {
        projectId,
        email,
        name,
        emailVerified: emailVerified || false,
        avatarUrl,
        metadata: metadata ? JSON.stringify(metadata) : null,
        stripeCustomerId,
        subscriptionStatus,
        signupSource
      }
    })

    return NextResponse.json({ endUser })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/end-users?id=xxx
 * Delete an end user
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.endUser.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
