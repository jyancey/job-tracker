// GET/POST API route for AI configuration persistence to SQLite.
import { NextResponse } from 'next/server'
import { getAIConfig, saveAIConfig } from '../../../backend/sqliteStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = getAIConfig()
    return NextResponse.json({ config })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load config',
      },
      { status: 400 },
    )
  }
}

export async function POST(request: Request) {
  try {
    type RequestBody = {
      config?: Record<string, unknown>
    }
    const body = (await request.json()) as RequestBody
    const config = (body.config || body || {}) as Record<string, unknown>

    saveAIConfig(config)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to save config',
      },
      { status: 400 },
    )
  }
}
