import type { JobDraft, JobStatus } from '../domain'
import { StatusSelect } from './StatusSelect'

interface JobFormProps {
  draft: JobDraft
  editingId: string | null
  onUpdateDraft: <K extends keyof JobDraft>(key: K, value: JobDraft[K]) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function JobForm({ draft, editingId, onUpdateDraft, onSubmit, onCancel }: JobFormProps) {
  return (
    <form onSubmit={onSubmit} className="job-form">
      <label>
        Company *
        <input
          value={draft.company}
          onChange={(event) => onUpdateDraft('company', event.target.value)}
          required
          placeholder="Acme Labs"
        />
      </label>
      <label>
        Role Title *
        <input
          value={draft.roleTitle}
          onChange={(event) => onUpdateDraft('roleTitle', event.target.value)}
          required
          placeholder="Product Designer"
        />
      </label>
      <label>
        Application Date *
        <input
          type="date"
          value={draft.applicationDate}
          onChange={(event) => onUpdateDraft('applicationDate', event.target.value)}
          required
        />
      </label>
      <label>
        Status
        <StatusSelect
          value={draft.status}
          onChange={(value) => onUpdateDraft('status', value as JobStatus)}
          placeholder={false}
        />
      </label>
      <label>
        Job URL
        <input
          value={draft.jobUrl}
          onChange={(event) => onUpdateDraft('jobUrl', event.target.value)}
          placeholder="https://company.com/jobs/123"
        />
      </label>
      <label>
        ATS URL
        <input
          value={draft.atsUrl}
          onChange={(event) => onUpdateDraft('atsUrl', event.target.value)}
          placeholder="https://greenhouse.io/..."
        />
      </label>
      <label>
        Salary Range
        <input
          value={draft.salaryRange}
          onChange={(event) => onUpdateDraft('salaryRange', event.target.value)}
          placeholder="$130k - $150k"
        />
      </label>
      <label>
        Contact Person
        <input
          value={draft.contactPerson}
          onChange={(event) => onUpdateDraft('contactPerson', event.target.value)}
          placeholder="Taylor Singh"
        />
      </label>
      <label>
        Next Action
        <input
          value={draft.nextAction}
          onChange={(event) => onUpdateDraft('nextAction', event.target.value)}
          placeholder="Send follow-up email"
        />
      </label>
      <label>
        Next Action Due
        <input
          type="date"
          value={draft.nextActionDueDate}
          onChange={(event) => onUpdateDraft('nextActionDueDate', event.target.value)}
        />
      </label>
      <label className="full-width">
        Notes
        <textarea
          value={draft.notes}
          onChange={(event) => onUpdateDraft('notes', event.target.value)}
          placeholder="Networking context, interview prep notes, or recruiter details."
          rows={4}
        />
      </label>
      <div className="form-actions full-width">
        <button type="submit">{editingId ? 'Save Changes' : 'Add Job'}</button>
        {editingId && (
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  )
}
