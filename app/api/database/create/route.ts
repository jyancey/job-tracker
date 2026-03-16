import { NextResponse } from 'next/server'
import { jobStore } from '../../../../lib/jobStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(jobStore.createDatabase())
}
