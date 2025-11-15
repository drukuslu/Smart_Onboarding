import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './lib/prisma'

/**
 * API Key Authentication Middleware
 * Protects SDK API endpoints
 */
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Only apply to SDK API routes
  if (!pathname.startsWith('/api/sdk/')) {
    return NextResponse.next()
  }

  // Get API key from header
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key required' },
      { status: 401 }
    )
  }

  try {
    // Validate API key
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        project: {
          select: {
            id: true,
            slug: true,
            domain: true,
            userId: true
          }
        }
      }
    })

    if (!key) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Check expiration
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'API key expired' },
        { status: 401 }
      )
    }

    // Update last used timestamp (fire and forget)
    prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() }
    }).catch(() => {})

    // Add project info to request headers for downstream use
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-project-id', key.project.id)
    requestHeaders.set('x-project-slug', key.project.slug)

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export const config = {
  matcher: '/api/sdk/:path*'
}
