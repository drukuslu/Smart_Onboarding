import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/utils/crypto'
import { INTEGRATIONS } from '@/config/integrations'

/**
 * GET /api/integrations?projectId=xxx
 * List all integrations for a project
 */
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    const integrations = await prisma.integration.findMany({
      where: { projectId },
      select: {
        id: true,
        type: true,
        name: true,
        enabled: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Enrich with integration config from INTEGRATIONS
    const enriched = integrations.map(integration => ({
      ...integration,
      config: INTEGRATIONS[integration.type as keyof typeof INTEGRATIONS]
    }))

    return NextResponse.json({ integrations: enriched })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/integrations
 * Create or update an integration
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectId, accountId, type, name, credentials, config, enabled } = body

    if (!projectId || !accountId || !type || !credentials) {
      return NextResponse.json(
        { error: 'projectId, accountId, type, and credentials are required' },
        { status: 400 }
      )
    }

    // Validate integration type
    if (!INTEGRATIONS[type as keyof typeof INTEGRATIONS]) {
      return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 })
    }

    // Encrypt credentials
    const encryptedCredentials = encrypt(JSON.stringify(credentials))

    // Upsert integration
    const integration = await prisma.integration.upsert({
      where: {
        projectId_type: {
          projectId,
          type
        }
      },
      update: {
        name: name || INTEGRATIONS[type as keyof typeof INTEGRATIONS].name,
        credentials: encryptedCredentials,
        config: config ? JSON.stringify(config) : null,
        enabled: enabled !== undefined ? enabled : true
      },
      create: {
        projectId,
        accountId,
        type,
        name: name || INTEGRATIONS[type as keyof typeof INTEGRATIONS].name,
        credentials: encryptedCredentials,
        config: config ? JSON.stringify(config) : null,
        enabled: enabled !== undefined ? enabled : true
      }
    })

    return NextResponse.json({ integration: { id: integration.id, type: integration.type } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/integrations?id=xxx
 * Delete an integration
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.integration.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
