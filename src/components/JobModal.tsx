import type { Job } from '../domain'
import { formatDate } from '../utils/dateUtils'

interface JobModalProps {
  job: Job | null
  onClose: () => void
}

export function JobModal({ job, onClose }: JobModalProps) {
  if (!job) {
    return null
  }

  return (
    <div className="job-modal-backdrop" onClick={onClose}>
      <section className="job-modal" onClick={(event) => event.stopPropagation()}>
        <header className="job-modal-header">
          <div>
            <h3>{job.roleTitle}</h3>
            <p>{job.company}</p>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </header>

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
              <strong>{formatDate(job.aiScoredAt)}</strong>
              <small style={{ color: '#586069', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                via {job.aiModel || 'AI'}
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
