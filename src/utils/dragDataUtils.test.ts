import { describe, it, expect, vi } from 'vitest'
import {
  serializeJobData,
  deserializeJobData,
  setJobDragData,
  getJobDragData,
} from './dragDataUtils'
import type { Job } from '../domain'

describe('dragDataUtils', () => {
  const mockJob: Job = {
    id: '1',
    company: 'Acme Corp',
    roleTitle: 'Software Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: 'https://acme.com/jobs/123',
    atsUrl: '',
    salaryRange: '$120k - $150k',
    notes: 'Exciting opportunity',
    contactPerson: 'Jane Recruiter',
    nextAction: 'Follow up',
    nextActionDueDate: '2026-03-10',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  }

  describe('serializeJobData', () => {
    it('serializes job to JSON string', () => {
      const result = serializeJobData(mockJob)
      expect(typeof result).toBe('string')
      expect(JSON.parse(result)).toEqual(mockJob)
    })

    it('handles jobs with empty fields', () => {
      const minimalJob: Job = {
        ...mockJob,
        jobUrl: '',
        atsUrl: '',
        salaryRange: '',
        notes: '',
        contactPerson: '',
        nextAction: '',
        nextActionDueDate: '',
      }

      const result = serializeJobData(minimalJob)
      expect(JSON.parse(result)).toEqual(minimalJob)
    })
  })

  describe('deserializeJobData', () => {
    it('deserializes valid JSON string to job object', () => {
      const jsonString = JSON.stringify(mockJob)
      const result = deserializeJobData(jsonString)

      expect(result).toEqual(mockJob)
    })

    it('returns null for invalid JSON', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = deserializeJobData('invalid json')

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to parse dropped job data:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('returns null for empty string', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = deserializeJobData('')

      expect(result).toBeNull()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('setJobDragData', () => {
    it('sets job data on dataTransfer with default effect', () => {
      const mockDataTransfer = {
        effectAllowed: '',
        setData: vi.fn(),
      } as unknown as DataTransfer

      const mockEvent = {
        dataTransfer: mockDataTransfer,
      } as React.DragEvent<HTMLElement>

      setJobDragData(mockEvent, mockJob)

      expect(mockDataTransfer.effectAllowed).toBe('move')
      expect(mockDataTransfer.setData).toHaveBeenCalledWith(
        'application/json',
        JSON.stringify(mockJob)
      )
    })

    it('sets job data with custom drag effect', () => {
      const mockDataTransfer = {
        effectAllowed: '',
        setData: vi.fn(),
      } as unknown as DataTransfer

      const mockEvent = {
        dataTransfer: mockDataTransfer,
      } as React.DragEvent<HTMLElement>

      setJobDragData(mockEvent, mockJob, 'copy')

      expect(mockDataTransfer.effectAllowed).toBe('copy')
      expect(mockDataTransfer.setData).toHaveBeenCalledWith(
        'application/json',
        JSON.stringify(mockJob)
      )
    })
  })

  describe('getJobDragData', () => {
    it('retrieves and deserializes job data from dataTransfer', () => {
      const jobJson = JSON.stringify(mockJob)
      const mockDataTransfer = {
        getData: vi.fn().mockReturnValue(jobJson),
      } as unknown as DataTransfer

      const mockEvent = {
        dataTransfer: mockDataTransfer,
      } as React.DragEvent<HTMLElement>

      const result = getJobDragData(mockEvent)

      expect(mockDataTransfer.getData).toHaveBeenCalledWith('application/json')
      expect(result).toEqual(mockJob)
    })

    it('returns null when dataTransfer contains invalid JSON', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const mockDataTransfer = {
        getData: vi.fn().mockReturnValue('invalid json'),
      } as unknown as DataTransfer

      const mockEvent = {
        dataTransfer: mockDataTransfer,
      } as React.DragEvent<HTMLElement>

      const result = getJobDragData(mockEvent)

      expect(result).toBeNull()

      consoleErrorSpy.mockRestore()
    })

    it('returns null when dataTransfer is empty', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const mockDataTransfer = {
        getData: vi.fn().mockReturnValue(''),
      } as unknown as DataTransfer

      const mockEvent = {
        dataTransfer: mockDataTransfer,
      } as React.DragEvent<HTMLElement>

      const result = getJobDragData(mockEvent)

      expect(result).toBeNull()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('integration: round-trip serialization', () => {
    it('maintains data integrity through serialize/deserialize cycle', () => {
      const serialized = serializeJobData(mockJob)
      const deserialized = deserializeJobData(serialized)

      expect(deserialized).toEqual(mockJob)
    })

    it('maintains data integrity through full drag-drop cycle', () => {
      const mockDataTransfer = {
        effectAllowed: '',
        setData: vi.fn(),
        getData: vi.fn(),
      } as unknown as DataTransfer

      // Simulate drag start
      const dragStartEvent = {
        dataTransfer: mockDataTransfer,
      } as React.DragEvent<HTMLElement>

      setJobDragData(dragStartEvent, mockJob)

      // Capture the serialized data that was set
      const setDataCall = (mockDataTransfer.setData as ReturnType<typeof vi.fn>).mock.calls[0]
      const serializedData = setDataCall[1]

      // Simulate drop event retrieving the data
      ;(mockDataTransfer.getData as ReturnType<typeof vi.fn>).mockReturnValue(serializedData)

      const dropEvent = {
        dataTransfer: mockDataTransfer,
      } as React.DragEvent<HTMLElement>

      const retrievedJob = getJobDragData(dropEvent)

      expect(retrievedJob).toEqual(mockJob)
    })
  })
})
