import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJobForm } from './useJobForm'
import type { Job } from '../domain'

describe('useJobForm', () => {
  it('loads jobDescription fields when starting edit mode', () => {
    const { result } = renderHook(() => useJobForm())

    const job: Job = {
      id: 'job-1',
      company: 'Acme',
      roleTitle: 'Product Engineer',
      applicationDate: '2026-03-01',
      status: 'Applied',
      jobUrl: 'https://example.com/jobs/1',
      atsUrl: '',
      salaryRange: '$120k - $150k',
      notes: 'note',
      contactPerson: 'Taylor',
      nextAction: 'Follow up',
      nextActionDueDate: '2026-03-08',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      jobDescription: 'Original persisted description',
      jobDescriptionSource: 'scraped',
    }

    act(() => {
      result.current.startEdit(job)
    })

    expect(result.current.editingId).toBe('job-1')
    expect(result.current.draft.jobDescription).toBe('Original persisted description')
    expect(result.current.draft.jobDescriptionSource).toBe('scraped')
  })
})
