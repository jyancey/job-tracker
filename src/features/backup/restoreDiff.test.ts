import { describe, it, expect } from 'vitest'
import { calculateRestoreDiff, formatFieldName, formatFieldValue } from './restoreDiff'
import type { Job } from '../../domain'

const createJob = (overrides: Partial<Job>): Job => ({
  id: '1',
  company: 'Test Corp',
  roleTitle: 'Developer',
  status: 'Applied',
  applicationDate: '2024-01-01',
  jobUrl: '',
  atsUrl: '',
  salaryRange: '',
  notes: '',
  contactPerson: '',
  nextAction: '',
  nextActionDueDate: '',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('restoreDiff', () => {
  describe('calculateRestoreDiff', () => {
    it('should identify newly added jobs in upsert mode', () => {
      const currentJobs: Job[] = [createJob({ id: '1' })]
      const incomingJobs: Job[] = [createJob({ id: '1' }), createJob({ id: '2', company: 'New Corp' })]

      const diff = calculateRestoreDiff(currentJobs, incomingJobs, 'upsert')

      expect(diff.summary.added).toBe(1)
      expect(diff.summary.updated).toBe(0)
      expect(diff.summary.removed).toBe(0)
      expect(diff.summary.unchanged).toBe(1)
      expect(diff.changes).toHaveLength(2)
      expect(diff.changes.find((c) => c.id === '2')?.changeType).toBe('added')
    })

    it('should identify updated jobs with field changes in upsert mode', () => {
      const currentJobs: Job[] = [createJob({ id: '1', salaryRange: '$100k' })]
      const incomingJobs: Job[] = [createJob({ id: '1', salaryRange: '$120k' })]

      const diff = calculateRestoreDiff(currentJobs, incomingJobs, 'upsert')

      expect(diff.summary.updated).toBe(1)
      expect(diff.summary.added).toBe(0)
      expect(diff.summary.removed).toBe(0)

      const updatedChange = diff.changes.find((c) => c.id === '1')
      expect(updatedChange?.changeType).toBe('updated')
      expect(updatedChange?.fieldChanges).toHaveLength(1)
      expect(updatedChange?.fieldChanges[0].field).toBe('salaryRange')
      expect(updatedChange?.fieldChanges[0].oldValue).toBe('$100k')
      expect(updatedChange?.fieldChanges[0].newValue).toBe('$120k')
    })

    it('should not count field changes in append mode', () => {
      const currentJobs: Job[] = [createJob({ id: '1', salaryRange: '$100k' })]
      const incomingJobs: Job[] = [createJob({ id: '1', salaryRange: '$120k' }), createJob({ id: '2' })]

      const diff = calculateRestoreDiff(currentJobs, incomingJobs, 'append')

      expect(diff.summary.added).toBe(1)
      expect(diff.summary.updated).toBe(0)
      expect(diff.summary.unchanged).toBe(1) // Incoming job that matches existing id
    })

    it('should identify removed jobs in replace mode', () => {
      const currentJobs: Job[] = [createJob({ id: '1' }), createJob({ id: '2' }), createJob({ id: '3' })]
      const incomingJobs: Job[] = [createJob({ id: '1' })]

      const diff = calculateRestoreDiff(currentJobs, incomingJobs, 'replace')

      expect(diff.summary.removed).toBe(2)
      expect(diff.summary.unchanged).toBe(1) // The one matching job is unchanged
      expect(diff.changes.filter((c) => c.changeType === 'removed')).toHaveLength(2)
    })

    it('should identify multiple field changes in a single job', () => {
      const currentJobs: Job[] = [
        createJob({
          id: '1',
          salaryRange: '$100k',
          jobUrl: 'https://example.com/job1',
          notes: 'Old notes',
        }),
      ]
      const incomingJobs: Job[] = [
        createJob({
          id: '1',
          salaryRange: '$120k',
          jobUrl: 'https://example.com/job2',
          notes: 'New notes',
        }),
      ]

      const diff = calculateRestoreDiff(currentJobs, incomingJobs, 'upsert')

      const updatedChange = diff.changes.find((c) => c.id === '1')
      expect(updatedChange?.fieldChanges).toHaveLength(3)
      expect(updatedChange?.fieldChanges.map((fc) => fc.field)).toContain('salaryRange')
      expect(updatedChange?.fieldChanges.map((fc) => fc.field)).toContain('jobUrl')
      expect(updatedChange?.fieldChanges.map((fc) => fc.field)).toContain('notes')
    })

    it('should mark jobs as unchanged when no fields differ', () => {
      const job = createJob({ id: '1', company: 'Same Corp' })
      const currentJobs: Job[] = [job]
      const incomingJobs: Job[] = [{ ...job }] // Deep clone

      const diff = calculateRestoreDiff(currentJobs, incomingJobs, 'upsert')

      expect(diff.summary.unchanged).toBe(1)
      expect(diff.summary.added).toBe(0)
      expect(diff.summary.updated).toBe(0)
      expect(diff.summary.removed).toBe(0)
    })

    it('should handle empty current jobs', () => {
      const incomingJobs: Job[] = [createJob({ id: '1' }), createJob({ id: '2' })]

      const diff = calculateRestoreDiff([], incomingJobs, 'upsert')

      expect(diff.summary.added).toBe(2)
      expect(diff.summary.updated).toBe(0)
      expect(diff.summary.removed).toBe(0)
    })

    it('should handle empty incoming jobs in replace mode', () => {
      const currentJobs: Job[] = [createJob({ id: '1' }), createJob({ id: '2' })]

      const diff = calculateRestoreDiff(currentJobs, [], 'replace')

      expect(diff.summary.removed).toBe(2)
      expect(diff.summary.added).toBe(0)
    })

    it('should sort changes by type: removed, updated, added, unchanged', () => {
      const currentJobs: Job[] = [
        createJob({ id: '1', salaryRange: '$100k' }), // will be updated
        createJob({ id: '2' }), // will be removed
        createJob({ id: '3' }), // will be unchanged
      ]
      const incomingJobs: Job[] = [
        createJob({ id: '1', salaryRange: '$120k' }), // updated
        createJob({ id: '3' }), // unchanged
        createJob({ id: '4' }), // added
      ]

      const diff = calculateRestoreDiff(currentJobs, incomingJobs, 'replace')

  // Check order: removed first, then updated, then added, then unchanged
  const removed = diff.changes.filter((c) => c.changeType === 'removed')
  const updated = diff.changes.filter((c) => c.changeType === 'updated')
  const added = diff.changes.filter((c) => c.changeType === 'added')
  const unchanged = diff.changes.filter((c) => c.changeType === 'unchanged')
      
  expect(removed).toHaveLength(1)
  expect(updated).toHaveLength(1)
  expect(added).toHaveLength(1)
  expect(unchanged).toHaveLength(1)
      
  // Verify sorting order
  const types = diff.changes.map((c) => c.changeType)
  const removedIdx = types.indexOf('removed')
  const updatedIdx = types.indexOf('updated')
  const addedIdx = types.indexOf('added')
  const unchangedIdx = types.indexOf('unchanged')
      
  expect(removedIdx).toBeLessThan(updatedIdx)
  expect(updatedIdx).toBeLessThan(addedIdx)
  expect(addedIdx).toBeLessThan(unchangedIdx)
    })
  })

  describe('formatFieldName', () => {
    it('should convert camelCase to Title Case', () => {
      expect(formatFieldName('applicationDate')).toBe('Application Date')
      expect(formatFieldName('nextActionDue')).toBe('Next Action Due')
      expect(formatFieldName('aiScore')).toBe('Ai Score')
      expect(formatFieldName('pdfPath')).toBe('Pdf Path')
    })

    it('should handle single word fields', () => {
      expect(formatFieldName('company')).toBe('Company')
      expect(formatFieldName('salary')).toBe('Salary')
    })
  })

  describe('formatFieldValue', () => {
    it('should format empty values', () => {
      expect(formatFieldValue(null)).toBe('(empty)')
      expect(formatFieldValue(undefined)).toBe('(empty)')
      expect(formatFieldValue('')).toBe('(empty)')
    })

    it('should format boolean values', () => {
      expect(formatFieldValue(true)).toBe('Yes')
      expect(formatFieldValue(false)).toBe('No')
    })

    it('should format number values', () => {
      expect(formatFieldValue(100000)).toBe('100000')
      expect(formatFieldValue(0)).toBe('0')
    })

    it('should format string values', () => {
      expect(formatFieldValue('Test Corporation')).toBe('Test Corporation')
    })

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(150)
      const formatted = formatFieldValue(longString)

      expect(formatted).toHaveLength(103) // 100 chars + '...'
      expect(formatted.endsWith('...')).toBe(true)
    })

    it('should format objects as JSON', () => {
      const obj = { key: 'value' }
      expect(formatFieldValue(obj)).toBe(JSON.stringify(obj))
    })
  })
})
