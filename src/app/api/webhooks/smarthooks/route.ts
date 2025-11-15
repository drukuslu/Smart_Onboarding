import { NextRequest, NextResponse } from 'next/server'
import { emitEvent } from '@/lib/webhooks/smarthooks'

/**
 * POST /api/webhooks/smarthooks
 * Emit an event to SmartHooks
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventType, projectId, userId, data, metadata } = body

    if (!eventType || !projectId || !data) {
      return NextResponse.json(
        { error: 'eventType, projectId, and data are required' },
        { status: 400 }
      )
    }

    const result = await emitEvent(eventType, projectId, data, userId)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
