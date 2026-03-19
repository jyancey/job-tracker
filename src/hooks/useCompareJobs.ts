// Manages state for comparing multiple selected jobs with modal visibility and selection.
import { useCallback, useMemo, useState } from 'react'
import type { Job } from '../domain'

interface UseCompareJobsProps {
  jobs: Job[]
  selectedIds: Set<string>
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function useCompareJobs({ jobs, selectedIds, addNotification }: UseCompareJobsProps) {
  const [showCompare, setShowCompare] = useState(false)

  const selectedJobs = useMemo(() => jobs.filter((job) => selectedIds.has(job.id)), [jobs, selectedIds])

  const handleCompare = useCallback(() => {
    if (selectedIds.size === 0) {
      addNotification('Select jobs to compare', 'info')
      return
    }
    setShowCompare(true)
  }, [selectedIds, addNotification])

  const closeCompare = useCallback(() => {
    setShowCompare(false)
  }, [])

  return {
    showCompare,
    selectedJobs,
    handleCompare,
    closeCompare,
  }
}
