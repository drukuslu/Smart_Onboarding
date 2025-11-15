import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateApiKey } from '@/lib/utils/crypto'

/**
 * GET /api/projects?userId=xxx
 * List all projects for a user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            integrations: true,
            endUsers: true,
            apiKeys: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ projects })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, description, domain, userId } = body

    if (!name || !slug || !userId) {
      return NextResponse.json(
        { error: 'name, slug, and userId are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await prisma.project.findUnique({
      where: { slug }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A project with this slug already exists' },
        { status: 400 }
      )
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        slug,
        description,
        domain,
        userId
      }
    })

    // Automatically create an API key for the project
    const apiKey = await prisma.apiKey.create({
      data: {
        key: generateApiKey(),
        name: 'Default API Key',
        projectId: project.id
      }
    })

    return NextResponse.json({
      project,
      apiKey: {
        id: apiKey.id,
        key: apiKey.key,
        name: apiKey.name
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/projects/:id
 * Update a project
 */
export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const body = await req.json()
    const { name, description, domain, webhookUrl } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(domain !== undefined && { domain }),
        ...(webhookUrl !== undefined && { webhookUrl })
      }
    })

    return NextResponse.json({ project })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
