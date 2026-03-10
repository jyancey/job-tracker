import { useCallback } from 'react'
import type { FormEvent } from 'react'
import type { Job, JobDraft } from '../domain'
import * as jobService from '../services/jobService'

interface UseJobSubmissionProps {
  editingId: string | null
  submitForm: (event: FormEvent<HTMLFormElement>) => JobDraft | null
  resetForm: () => void
  setJobs: (updater: (jobs: Job[]) => Job[]) => void
  triggerAiScoring: (
    jobDescription: string,
    roleTitle: string,
    company: string,
    salaryRange: string,
    jobId: string,
    setJobs: (updater: (jobs: Job[]) => Job[]) => void,
  ) => void
}

export function useJobSubmission({ editingId, submitForm, resetForm, setJobs, triggerAiScoring }: UseJobSubmissionProps) {
  const handleSubmitJob = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      const normalizedDraft = submitForm(event)
      if (!normalizedDraft) {
        return
      }

      const hasExistingScore =
        normalizedDraft.scoreFit != null ||
        normalizedDraft.scoreCompensation != null ||
        normalizedDraft.scoreLocation != null ||
        normalizedDraft.scoreGrowth != null ||
        normalizedDraft.scoreConfidence != null ||
        Boolean(normalizedDraft.aiScoredAt)

      let newJobId: string | null = editingId || null

      if (editingId) {
        setJobs((current) => jobService.updateJob(current, editingId, normalizedDraft))
      } else {
        setJobs((current) => {
          const updated = jobService.createJob(current, normalizedDraft)
          newJobId = updated[0].id
          return updated
        })
      }

      resetForm()

      if (hasExistingScore) {
        return
      }

      triggerAiScoring(
        normalizedDraft.jobDescription ?? '',
        normalizedDraft.roleTitle,
        normalizedDraft.company,
        normalizedDraft.salaryRange,
        newJobId || '',
        setJobs,
      )
    },
    [editingId, submitForm, resetForm, setJobs, triggerAiScoring],
  )

  return { handleSubmitJob }
}
