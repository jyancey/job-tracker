import { NextResponse } from 'next/server'
import { jobStore } from '../../../../lib/jobStore'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(jobStore.testConnection())
}
