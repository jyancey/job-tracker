import type { Job } from '../domain'
import { formatDate } from '../utils/dateUtils'
import { calculateDaysInCurrentStatus, DEFAULT_STUCK_THRESHOLDS } from '../features/analytics'

interface JobModalProps {
  job: Job | null
  onClose: () => void
  onReAnalyze: (
    jobDescription: string,
    roleTitle: string,
    company: string,
    salaryRange: string,
    jobId: string,
    setJobs: (updater: (jobs: Job[]) => Job[]) => void
  ) => void
  setJobs: (updater: (jobs: Job[]) => Job[]) => void
}

export function JobModal({ job, onClose, onReAnalyze, setJobs }: JobModalProps) {
  if (!job) {
    return null
  }

  // Check if job is stuck
  const daysInStatus = calculateDaysInCurrentStatus(job)
  const threshold = DEFAULT_STUCK_THRESHOLDS[job.status as keyof typeof DEFAULT_STUCK_THRESHOLDS]
  const isStuck = threshold !== undefined && daysInStatus > threshold

  return (
    <div className="job-modal-backdrop" onClick={onClose}>
      <section className="job-modal" onClick={(event) => event.stopPropagation()}>
        <header className="job-modal-header">
          <div>
            <div className="job-modal-title-row">
              <h3>{job.roleTitle}</h3>
              {isStuck && (
                <span className="stuck-job-badge" title={`Stuck for ${daysInStatus} days (threshold: ${threshold} days)`}>
                  ⚠️ Stuck
                </span>
              )}
            </div>
            <p>{job.company}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {job.jobDescription && (
              <button
                type="button"
                className="small"
                onClick={() => onReAnalyze(job.jobDescription || '', job.roleTitle, job.company, job.salaryRange, job.id, setJobs)}
                disabled={job.aiScoringInProgress}
                title="Trigger AI analysis to re-score this job"
              >
                Re-Analyze
              </button>
            )}
            <button type="button" className="ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        {isStuck && (
          <div className="stuck-job-info">
            <strong>This job has been in {job.status} for {daysInStatus} days</strong> (threshold: {threshold} days)
          </div>
        )}

        <div className="job-modal-grid">
          <article>
            <span>Status</span>
            <strong>{job.status}</strong>
          </article>
          <article>
            <span>Applied</span>
            <strong>{formatDate(job.applicationDate)}</strong>
          </article>
          <article>
            <span>Salary</span>
            <strong>{job.salaryRange || '-'}</strong>
          </article>
          <article>
            <span>Contact</span>
            <strong>{job.contactPerson || '-'}</strong>
          </article>
          <article>
            <span>Next Action</span>
            <strong>{job.nextAction || '-'}</strong>
          </article>
          <article>
            <span>Next Action Due</span>
            <strong>{formatDate(job.nextActionDueDate)}</strong>
          </article>

          {job.scoreFit != null && (
            <>
              <article>
                <span>Fit</span>
                <strong>{job.scoreFit.toFixed(1)}/5</strong>
              </article>
              <article>
                <span>Compensation</span>
                <strong>{job.scoreCompensation != null ? job.scoreCompensation.toFixed(1) : '-'}/5</strong>
              </article>
              <article>
                <span>Location</span>
                <strong>{job.scoreLocation != null ? job.scoreLocation.toFixed(1) : '-'}/5</strong>
              </article>
              <article>
                <span>Growth</span>
                <strong>{job.scoreGrowth != null ? job.scoreGrowth.toFixed(1) : '-'}/5</strong>
              </article>
              <article>
                <span>Confidence</span>
                <strong>{job.scoreConfidence != null ? job.scoreConfidence.toFixed(1) : '-'}/5</strong>
              </article>
            </>
          )}

          {job.aiScoredAt && (
            <article>
              <span>AI Analysis</span>
              <strong>{formatDate(job.aiScoredAt.slice(0, 10))}</strong>
              <small style={{ color: '#586069', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                via {job.aiModel || 'AI'}
              </small>
            </article>
          )}

          {job.aiScoringInProgress && (
            <article>
              <span>AI Analysis</span>
              <strong>Processing...</strong>
              <small style={{ color: '#1f6feb', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Scoring is running in the background
              </small>
            </article>
          )}
        </div>

        <div className="job-modal-links">
          {job.jobUrl && (
            <a href={job.jobUrl} target="_blank" rel="noreferrer">
              Job Posting
            </a>
          )}
          {job.atsUrl && (
            <a href={job.atsUrl} target="_blank" rel="noreferrer">
              ATS Link
            </a>
          )}
        </div>

        {job.jobDescription?.trim() && (
          <div className="job-modal-notes">
            <h4>Job Description</h4>
            <p>{job.jobDescription}</p>
          </div>
        )}

        <div className="job-modal-notes">
          <h4>Notes</h4>
          <p>{job.notes || 'No notes added.'}</p>
        </div>

        {job.aiReasoning && (
          <div className="job-modal-notes">
            <h4>AI Analysis</h4>
            <p>{job.aiReasoning}</p>
          </div>
        )}
      </section>
    </div>
  )
}
