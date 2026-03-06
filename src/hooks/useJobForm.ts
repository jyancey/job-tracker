import { useState } from 'react'
import { EMPTY_JOB_DRAFT, type Job, type JobDraft } from '../domain'
import { normalizeUrl } from '../utils/stringUtils'

export interface UseJobFormResult {
  draft: JobDraft
  editingId: string | null
  isEditing: boolean
  updateDraft: <K extends keyof JobDraft>(key: K, value: JobDraft[K]) => void
  resetForm: () => void
  startEdit: (job: Job) => void
  submitForm: (event: React.FormEvent<HTMLFormElement>) => JobDraft | null
  isValid: boolean
}

/**
 * Hook to manage job form state and validation
 */
export function useJobForm(): UseJobFormResult {
  const [draft, setDraft] = useState<JobDraft>(EMPTY_JOB_DRAFT)
  const [editingId, setEditingId] = useState<string | null>(null)

  const isValid = Boolean(
    draft.company.trim() && draft.roleTitle.trim() && draft.applicationDate
  )

  function updateDraft<K extends keyof JobDraft>(key: K, value: JobDraft[K]): void {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function resetForm(): void {
    setDraft(EMPTY_JOB_DRAFT)
    setEditingId(null)
  }

  function startEdit(job: Job): void {
    setDraft({
      company: job.company,
      roleTitle: job.roleTitle,
      applicationDate: job.applicationDate,
      status: job.status,
      jobUrl: job.jobUrl,
      atsUrl: job.atsUrl,
      salaryRange: job.salaryRange,
      notes: job.notes,
      contactPerson: job.contactPerson,
      nextAction: job.nextAction,
      nextActionDueDate: job.nextActionDueDate,
      jobDescription: job.jobDescription,
      jobDescriptionSource: job.jobDescriptionSource,
      scoreFit: job.scoreFit,
      scoreCompensation: job.scoreCompensation,
      scoreLocation: job.scoreLocation,
      scoreGrowth: job.scoreGrowth,
      scoreConfidence: job.scoreConfidence,
      aiScoredAt: job.aiScoredAt,
      aiModel: job.aiModel,
      aiReasoning: job.aiReasoning,
    })
    setEditingId(job.id)
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>): JobDraft | null {
    event.preventDefault()
    
    if (!isValid) {
      return null
    }

    const normalizedDraft: JobDraft = {
      ...draft,
      company: draft.company.trim(),
      roleTitle: draft.roleTitle.trim(),
      jobUrl: normalizeUrl(draft.jobUrl),
      atsUrl: normalizeUrl(draft.atsUrl),
      notes: draft.notes.trim(),
      nextAction: draft.nextAction.trim(),
      contactPerson: draft.contactPerson.trim(),
      salaryRange: draft.salaryRange.trim(),
    }

    return normalizedDraft
  }

  return {
    draft,
    editingId,
    isEditing: editingId !== null,
    updateDraft,
    resetForm,
    startEdit,
    submitForm,
    isValid,
  }
}
