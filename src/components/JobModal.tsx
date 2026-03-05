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
      </section>
    </div>
  )
}
