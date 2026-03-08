import { useCallback } from 'react'
import type { Job, JobStatus } from '../domain'
import * as jobService from '../services/jobService'
import { scoreJobWithAI } from '../services/aiScoringService'
import { loadAIConfig, loadUserProfile } from '../storage/aiStorage'

interface UseJobOperationsProps {
  editingId: string | null
  resetForm: () => void
  viewingJob: Job | null
  closeViewOnly: () => void
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

/**
 * Encapsulates all job mutation operations (edit, delete, move, AI scoring).
 * Handles complex side effects like cascading form resets and AI scoring.
 */
export function useJobOperations({
  editingId,
  resetForm,
  viewingJob,
  closeViewOnly,
  addNotification,
}: UseJobOperationsProps) {
  const handleEditJob = useCallback(
    (startEdit: (job: Job) => void, job: Job) => {
      startEdit(job)
    },
    [],
  )

  const handleRemoveJob = useCallback(
    (id: string, setJobs: (updater: (jobs: Job[]) => Job[]) => void) => {
      setJobs((current) => jobService.deleteJob(current, id))
      if (editingId === id) {
        resetForm()
      }
      if (viewingJob?.id === id) {
        closeViewOnly()
      }
    },
    [editingId, resetForm, viewingJob, closeViewOnly],
  )

  const handleQuickMove = useCallback(
    (id: string, nextStatus: JobStatus, setJobs: (updater: (jobs: Job[]) => Job[]) => void) => {
      setJobs((current) => jobService.updateJobStatus(current, id, nextStatus))
    },
    [],
  )

  /**
   * Triggers AI scoring if enabled, profile configured, and job has description.
   * Updates job with AI scores asynchronously and non-blocking.
   */
  const triggerAiScoring = useCallback(
    (
      jobDescription: string,
      roleTitle: string,
      company: string,
      salaryRange: string,
      jobId: string,
      normalizedDraft: Partial<Job>,
      setJobs: (updater: (jobs: Job[]) => Job[]) => void,
    ) => {
      const shouldAutoScore = jobDescription && jobDescription.trim() && jobId

      if (!shouldAutoScore) {
        return
      }

      const aiConfig = loadAIConfig()
      const userProfile = loadUserProfile()

      if (aiConfig.provider === 'disabled' || !apiKeyConfigured(aiConfig)) {
        return
      }

      setTimeout(() => {
        try {
          scoreJobWithAI(
            {
              jobDescription,
              jobTitle: roleTitle,
              company,
              salaryRange,
              userProfile,
            },
            aiConfig,
          )
            .then((result) => {
              if (jobId) {
                setJobs((current) =>
                  jobService.updateJob(current, jobId, {
                    ...normalizedDraft,
                    scoreFit: result.scoreFit,
                    scoreCompensation: result.scoreCompensation,
                    scoreLocation: result.scoreLocation,
                    scoreGrowth: result.scoreGrowth,
                    scoreConfidence: result.scoreConfidence,
                    aiScoredAt: result.analyzedAt,
                    aiModel: result.model,
                    aiReasoning: result.reasoning,
                  }),
                )
                addNotification('AI scoring completed successfully', 'success')
              }
            })
            .catch((err) => {
              addNotification(`AI scoring failed: ${err.message}`, 'error')
            })
        } catch {
          // Silently handle errors during async scoring
        }
      }, 0)
    },
    [addNotification],
  )

  return {
    handleEditJob,
    handleRemoveJob,
    handleQuickMove,
    triggerAiScoring,
  }
}

function apiKeyConfigured(config: ReturnType<typeof loadAIConfig>): boolean {
  if (config.provider === 'openai') {
    return Boolean(config.apiKey?.trim())
  }
  if (config.provider === 'lmstudio') {
    return Boolean(config.baseUrl?.trim())
  }
  return false
}
