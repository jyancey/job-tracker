import type { JobDiff, RestoreDiff } from './restoreDiff'
import { formatFieldName, formatFieldValue } from './restoreDiff'

export interface RestoreDiffPreviewProps {
  diff: RestoreDiff
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function RestoreDiffPreview({ diff, onConfirm, onCancel, loading = false }: RestoreDiffPreviewProps) {
  const { changes, summary } = diff
  const hasChanges = summary.added + summary.removed + summary.updated > 0

  // Filter out unchanged for cleaner display
  const significantChanges = changes.filter((change) => change.changeType !== 'unchanged')

  return (
    <div className="restore-diff-preview">
      <div className="diff-header">
        <h3>Restore Preview</h3>
        <div className="diff-summary">
          {summary.added > 0 && <span className="diff-stat added">+{summary.added} added</span>}
          {summary.updated > 0 && <span className="diff-stat updated">~{summary.updated} updated</span>}
          {summary.removed > 0 && <span className="diff-stat removed">-{summary.removed} removed</span>}
          {summary.unchanged > 0 && <span className="diff-stat unchanged">{summary.unchanged} unchanged</span>}
        </div>
      </div>

      {!hasChanges && (
        <div className="diff-empty">
          <p>No changes detected. All jobs in the backup match your current data.</p>
        </div>
      )}

      {hasChanges && (
        <div className="diff-changes">
          {significantChanges.length > 0 ? (
            <div className="diff-list">
              {significantChanges.map((change) => (
                <JobDiffCard key={change.id} diff={change} />
              ))}
            </div>
          ) : (
            <p className="diff-note">All changes are updates to existing jobs with no field changes shown.</p>
          )}
        </div>
      )}

      <div className="diff-actions">
        <button type="button" className="button-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="button" className="button-primary" onClick={onConfirm} disabled={loading}>
          {loading ? 'Applying...' : hasChanges ? 'Apply Changes' : 'Close'}
        </button>
      </div>
    </div>
  )
}

function JobDiffCard({ diff }: { diff: JobDiff }) {
  const { changeType, company, roleTitle, fieldChanges } = diff

  return (
    <div className={`job-diff-card diff-${changeType}`}>
      <div className="job-diff-header">
        <span className={`change-badge badge-${changeType}`}>{changeType}</span>
        <div className="job-diff-title">
          <strong>{company}</strong>
          <span className="job-diff-role">{roleTitle}</span>
        </div>
      </div>

      {fieldChanges.length > 0 && (
        <div className="field-changes">
          {fieldChanges.map((fieldChange, idx) => (
            <div key={idx} className="field-change">
              <div className="field-name">{formatFieldName(fieldChange.field)}</div>
              <div className="field-change-values">
                <div className="field-old-value">
                  <span className="field-label">Old:</span>
                  <span className="field-value">{formatFieldValue(fieldChange.oldValue)}</span>
                </div>
                <div className="field-new-value">
                  <span className="field-label">New:</span>
                  <span className="field-value">{formatFieldValue(fieldChange.newValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
