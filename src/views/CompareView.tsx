// Side-by-side comparison table for selected jobs with weighted score calculations.
import type { Job } from '../domain'
import { DEFAULT_SCORE_WEIGHTS, hasScoring, type ScoreWeights } from '../services/scoring'
import { formatDate } from '../utils/dateUtils'
import { ScoreCell } from '../components/ScoreCell'

interface CompareViewProps {
  jobs: Job[]
  weights?: ScoreWeights
  onClose: () => void
}

export function CompareView({ jobs, weights = DEFAULT_SCORE_WEIGHTS, onClose }: CompareViewProps) {
  if (jobs.length === 0) {
    return (
      <div className="compare-view">
        <div className="compare-header">
          <h2>Compare Jobs</h2>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="empty">Select jobs to compare from the table.</p>
      </div>
    )
  }

  const hasAnyScoring = jobs.some(hasScoring)

  return (
    <div className="compare-view">
      <div className="compare-header">
        <h2>Compare Jobs ({jobs.length})</h2>
        <button type="button" className="ghost" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="compare-grid">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-label">Field</th>
              {jobs.map((job) => (
                <th key={job.id} className="compare-job">
                  <div className="compare-job-header">
                    <strong>{job.company}</strong>
                    <span>{job.roleTitle}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hasAnyScoring && (
              <>
                <tr className="compare-section-header">
                  <td colSpan={jobs.length + 1}>
                    <strong>Quality Scoring</strong>
                  </td>
                </tr>
                <tr>
                  <td className="compare-label">Total Score</td>
                  {jobs.map((job) => (
                    <td key={job.id} className="compare-cell compare-score">
                      <ScoreCell job={job} weights={weights} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="compare-label">Fit</td>
                  {jobs.map((job) => (
                    <td key={job.id} className="compare-cell">
                      {job.scoreFit != null ? job.scoreFit.toFixed(1) : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="compare-label">Compensation</td>
                  {jobs.map((job) => (
                    <td key={job.id} className="compare-cell">
                      {job.scoreCompensation != null ? job.scoreCompensation.toFixed(1) : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="compare-label">Location</td>
                  {jobs.map((job) => (
                    <td key={job.id} className="compare-cell">
                      {job.scoreLocation != null ? job.scoreLocation.toFixed(1) : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="compare-label">Growth</td>
                  {jobs.map((job) => (
                    <td key={job.id} className="compare-cell">
                      {job.scoreGrowth != null ? job.scoreGrowth.toFixed(1) : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="compare-label">Confidence</td>
                  {jobs.map((job) => (
                    <td key={job.id} className="compare-cell">
                      {job.scoreConfidence != null ? job.scoreConfidence.toFixed(1) : '—'}
                    </td>
                  ))}
                </tr>
              </>
            )}

            <tr className="compare-section-header">
              <td colSpan={jobs.length + 1}>
                <strong>Job Details</strong>
              </td>
            </tr>
            <tr>
              <td className="compare-label">Status</td>
              {jobs.map((job) => (
                <td key={job.id} className="compare-cell">
                  {job.status}
                </td>
              ))}
            </tr>
            <tr>
              <td className="compare-label">Application Date</td>
              {jobs.map((job) => (
                <td key={job.id} className="compare-cell">
                  {formatDate(job.applicationDate)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="compare-label">Salary Range</td>
              {jobs.map((job) => (
                <td key={job.id} className="compare-cell">
                  {job.salaryRange || '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="compare-label">Contact Person</td>
              {jobs.map((job) => (
                <td key={job.id} className="compare-cell">
                  {job.contactPerson || '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="compare-label">Next Action</td>
              {jobs.map((job) => (
                <td key={job.id} className="compare-cell">
                  {job.nextAction || '—'}
                  {job.nextActionDueDate && (
                    <>
                      <br />
                      <small>Due: {formatDate(job.nextActionDueDate)}</small>
                    </>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="compare-label">Notes</td>
              {jobs.map((job) => (
                <td key={job.id} className="compare-cell compare-notes">
                  {job.notes || '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="compare-label">Links</td>
              {jobs.map((job) => (
                <td key={job.id} className="compare-cell">
                  {job.jobUrl && (
                    <>
                      <a href={job.jobUrl} target="_blank" rel="noopener noreferrer">
                        Job Posting
                      </a>
                      <br />
                    </>
                  )}
                  {job.atsUrl && (
                    <a href={job.atsUrl} target="_blank" rel="noopener noreferrer">
                      ATS Portal
                    </a>
                  )}
                  {!job.jobUrl && !job.atsUrl && '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
