import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/email-templates?projectId=xxx
 * List all email templates for a project
 */
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')
    const category = req.nextUrl.searchParams.get('category')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    const templates = await prisma.emailTemplate.findMany({
      where: {
        projectId,
        ...(category && { category })
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ templates })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/email-templates
 * Create a new email template
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      projectId,
      name,
      subject,
      htmlContent,
      textContent,
      templateType,
      category,
      variables
    } = body

    if (!projectId || !name || !subject || !htmlContent || !templateType || !category) {
      return NextResponse.json(
        { error: 'projectId, name, subject, htmlContent, templateType, and category are required' },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.create({
      data: {
        projectId,
        name,
        subject,
        htmlContent,
        textContent,
        templateType,
        category,
        variables: variables ? JSON.stringify(variables) : null
      }
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/email-templates?id=xxx
 * Update an email template
 */
export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const body = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...body,
        variables: body.variables ? JSON.stringify(body.variables) : undefined
      }
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/email-templates?id=xxx
 * Delete an email template
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.emailTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
