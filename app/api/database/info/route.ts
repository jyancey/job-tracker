// GET endpoint to retrieve database metadata and connection information.
import { NextResponse } from 'next/server'
import { jobStore } from '../../../../backend/jobStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(jobStore.getDatabaseInfo())
}
