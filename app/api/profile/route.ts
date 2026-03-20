// GET/POST API route for user profile persistence to SQLite.
import { NextResponse } from 'next/server'
import { getUserProfile, saveUserProfile } from '../../../backend/sqliteStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const profile = getUserProfile()
    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load profile',
      },
      { status: 400 },
    )
  }
}

export async function POST(request: Request) {
  try {
    type RequestBody = {
      profile?: Record<string, unknown>
    }
    const body = (await request.json()) as RequestBody
    const profile = (body.profile || body || {}) as Record<string, unknown>

    saveUserProfile(profile)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to save profile',
      },
      { status: 400 },
    )
  }
}
