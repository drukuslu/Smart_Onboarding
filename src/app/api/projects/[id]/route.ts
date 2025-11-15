import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/projects/:id
 * Get a single project with all details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        integrations: {
          select: {
            id: true,
            type: true,
            name: true,
            enabled: true,
            createdAt: true
          }
        },
        apiKeys: {
          select: {
            id: true,
            key: true,
            name: true,
            lastUsedAt: true,
            expiresAt: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            endUsers: true,
            emailTemplates: true,
            emailCampaigns: true,
            subscriptions: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
