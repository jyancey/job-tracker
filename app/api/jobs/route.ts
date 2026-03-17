import { NextResponse } from 'next/server'
import { validateJobArray } from '../../../backend/jobValidation'
import { jobStore } from '../../../backend/jobStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ jobs: jobStore.listJobs() })
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { jobs?: unknown[] }
    const jobs = Array.isArray(body?.jobs) ? body.jobs : []

    const validation = validateJobArray(jobs)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 422 })
    }

    jobStore.replaceAllJobs(jobs)
    return NextResponse.json({ ok: true, count: jobs.length })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update jobs',
      },
      { status: 400 },
    )
  }
}
