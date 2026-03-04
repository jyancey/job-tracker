import { describe, expect, it, vi } from 'vitest'
import { EMPTY_JOB_DRAFT, createJobFromDraft } from './domain'

describe('createJobFromDraft', () => {
  it('creates a complete job with id and timestamps', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '11111111-1111-1111-1111-111111111111',
    )

    const before = new Date().toISOString()
    const result = createJobFromDraft({
      ...EMPTY_JOB_DRAFT,
      company: 'Acme Labs',
      roleTitle: 'Product Designer',
      applicationDate: '2026-03-04',
      notes: 'Strong mission fit',
    })
    const after = new Date().toISOString()

    expect(result.id).toBe('11111111-1111-1111-1111-111111111111')
    expect(result.company).toBe('Acme Labs')
    expect(result.roleTitle).toBe('Product Designer')
    expect(result.applicationDate).toBe('2026-03-04')
    expect(result.createdAt >= before).toBe(true)
    expect(result.createdAt <= after).toBe(true)
    expect(result.updatedAt).toBe(result.createdAt)
  })
})
