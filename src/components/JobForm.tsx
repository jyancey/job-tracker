import { useRef, useState } from 'react'
import type { JobDraft, JobStatus } from '../domain'
import { StatusSelect } from './StatusSelect'
import { scrapeJobDescription } from '../services/jobScrapingService'

interface JobFormProps {
  draft: JobDraft
  editingId: string | null
  onUpdateDraft: <K extends keyof JobDraft>(key: K, value: JobDraft[K]) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function JobForm({ draft, editingId, onUpdateDraft, onSubmit, onCancel }: JobFormProps) {
  const [scrapingLoading, setScrapingLoading] = useState(false)
  const [scrapingError, setScrapingError] = useState('')
  const descriptionFileRef = useRef<HTMLInputElement>(null)

  const handleScrapeDescription = async () => {
    if (!draft.jobUrl.trim()) {
      setScrapingError('Please enter a job URL first')
      return
    }

    setScrapingLoading(true)
    setScrapingError('')

    try {
      const result = await scrapeJobDescription(draft.jobUrl)
      if (result.success && result.description) {
        onUpdateDraft('jobDescription', result.description)
        onUpdateDraft('jobDescriptionSource', 'scraped')
      } else {
        setScrapingError(result.error || 'Failed to scrape job description')
      }
    } catch (err) {
      setScrapingError(err instanceof Error ? err.message : 'Failed to scrape job description')
    } finally {
      setScrapingLoading(false)
    }
  }

  const handleDescriptionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScrapingError('')
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        onUpdateDraft('jobDescription', text)
        onUpdateDraft('jobDescriptionSource', 'upload')
      } catch (err) {
        setScrapingError('Failed to read file')
      }
    }
    reader.readAsText(file)

    if (descriptionFileRef.current) {
      descriptionFileRef.current.value = ''
    }
  }
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

      <fieldset className="full-width">
        <legend>Job Description</legend>
        <div className="job-description-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={handleScrapeDescription}
            disabled={scrapingLoading || !draft.jobUrl.trim()}
          >
            {scrapingLoading ? 'Scraping...' : 'Scrape from URL'}
          </button>
          <label className="button button-secondary">
            Upload File
            <input
              ref={descriptionFileRef}
              type="file"
              accept=".txt,.html,.pdf"
              onChange={handleDescriptionFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {scrapingError && <div className="error-message-inline">{scrapingError}</div>}

        <label className="full-width" style={{ marginTop: '0.5rem' }}>
          Description
          <textarea
            value={draft.jobDescription || ''}
            onChange={(event) => {
              onUpdateDraft('jobDescription', event.target.value)
              if (event.target.value.trim()) {
                onUpdateDraft('jobDescriptionSource', 'paste')
              }
            }}
            placeholder="Job description text (copy-paste here or use Scrape from URL)"
            rows={6}
          />
        </label>
        {draft.jobDescription && (
          <small className="job-description-source">
            Source: {draft.jobDescriptionSource || 'pasted'} ({draft.jobDescription.length} characters)
          </small>
        )}
      </fieldset>

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

      <fieldset className="full-width">
        <legend>Quality Scores (0-5, optional)</legend>
        <div className="score-grid">
          <label>
            Fit
            <input
              type="number"
              min="0"
              max="5"
              step="0.5"
              value={draft.scoreFit ?? ''}
              onChange={(event) =>
                onUpdateDraft('scoreFit', event.target.value ? Number(event.target.value) : undefined)
              }
              placeholder="0-5"
            />
          </label>
          <label>
            Compensation
            <input
              type="number"
              min="0"
              max="5"
              step="0.5"
              value={draft.scoreCompensation ?? ''}
              onChange={(event) =>
                onUpdateDraft('scoreCompensation', event.target.value ? Number(event.target.value) : undefined)
              }
              placeholder="0-5"
            />
          </label>
          <label>
            Location
            <input
              type="number"
              min="0"
              max="5"
              step="0.5"
              value={draft.scoreLocation ?? ''}
              onChange={(event) =>
                onUpdateDraft('scoreLocation', event.target.value ? Number(event.target.value) : undefined)
              }
              placeholder="0-5"
            />
          </label>
          <label>
            Growth
            <input
              type="number"
              min="0"
              max="5"
              step="0.5"
              value={draft.scoreGrowth ?? ''}
              onChange={(event) =>
                onUpdateDraft('scoreGrowth', event.target.value ? Number(event.target.value) : undefined)
              }
              placeholder="0-5"
            />
          </label>
          <label>
            Confidence
            <input
              type="number"
              min="0"
              max="5"
              step="0.5"
              value={draft.scoreConfidence ?? ''}
              onChange={(event) =>
                onUpdateDraft('scoreConfidence', event.target.value ? Number(event.target.value) : undefined)
              }
              placeholder="0-5"
            />
          </label>
        </div>
      </fieldset>

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
