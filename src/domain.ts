/**
 * All valid application status values, representing stages in the hiring pipeline.
 */
export const JOB_STATUSES = [
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
] as const

/** A single stage in the hiring pipeline. */
export type JobStatus = (typeof JOB_STATUSES)[number]

/**
 * Priority levels for a job opportunity or next action.
 */
export const JOB_PRIORITIES = ['High', 'Medium', 'Low'] as const

/** 
 * A priority level for a job or its associated next action. 
 */
export type JobPriority = (typeof JOB_PRIORITIES)[number]

/**
 * A tracked job opportunity.
 */
export interface Job {
  /** Unique identifier for this job record. */
  id: string
  /** Name of the hiring company. */
  company: string
  /** Job title or role being applied for. */
  roleTitle: string
  /** ISO date string for when the application was submitted. */
  applicationDate: string
  /** Current stage in the hiring pipeline. */
  status: JobStatus
  /** Public job posting URL. */
  jobUrl: string
  /** ATS or internal application tracking URL. */
  atsUrl: string
  /** Salary range as a raw string (e.g. `"$120k–$150k"`). */
  salaryRange: string
  /** Free-text notes about the opportunity. */
  notes: string
  /** Name of the primary recruiter or hiring contact. */
  contactPerson: string
  /** Description of the next scheduled action. */
  nextAction: string
  /** ISO date string for when the next action is due. */
  nextActionDueDate: string
  /** Priority level for this opportunity. Defaults to `'Medium'`. */
  priority?: JobPriority
  /** ISO timestamp for when this record was created. */
  createdAt: string
  /** ISO timestamp for when this record was last updated. */
  updatedAt: string
  /** Full text of the job description, used for AI analysis. */
  jobDescription?: string
  /** How the job description was collected. */
  jobDescriptionSource?: 'url' | 'paste' | 'upload' | 'scraped'
  /** Fit score (0–5) representing role alignment. */
  scoreFit?: number
  /** Compensation score (0–5) representing salary/benefits alignment. */
  scoreCompensation?: number
  /** Location or remote-work alignment score (0–5). */
  scoreLocation?: number
  /** Career growth trajectory alignment score (0–5). */
  scoreGrowth?: number
  /** Confidence score (0–5) representing likelihood of progressing. */
  scoreConfidence?: number
  /** ISO timestamp for when AI scoring was last applied. */
  aiScoredAt?: string
  /** Identifier of the AI model used for scoring. */
  aiModel?: string
  /** Free-text reasoning returned by the AI scorer. */
  aiReasoning?: string
  /** True while an AI scoring request is in-flight. */
  aiScoringInProgress?: boolean
}

/**
 * A {@link Job} without system-managed fields, used when creating a new record.
 *
 * The `id`, `createdAt`, and `updatedAt` fields are populated by {@link createJobFromDraft}.
 */
export type JobDraft = Omit<Job, 'id' | 'createdAt' | 'updatedAt'>

/** A blank job draft suitable for initializing a new-job form. */
export const EMPTY_JOB_DRAFT: JobDraft = {
  company: '',
  roleTitle: '',
  applicationDate: '',
  status: 'Applied',
  jobUrl: '',
  atsUrl: '',
  salaryRange: '',
  notes: '',
  contactPerson: '',
  nextAction: '',
  nextActionDueDate: '',
  priority: 'Medium',
  jobDescription: '',
  jobDescriptionSource: undefined,
  scoreFit: undefined,
  scoreCompensation: undefined,
  scoreLocation: undefined,
  scoreGrowth: undefined,
  scoreConfidence: undefined,
  aiScoredAt: undefined,
  aiModel: undefined,
  aiReasoning: undefined,
  aiScoringInProgress: undefined,
}

/**
 * Create a new {@link Job} from a {@link JobDraft}.
 *
 * Generates a UUID for `id` and sets both `createdAt` and `updatedAt` to the current time.
 *
 * @param draft - The draft values to promote into a full Job record.
 * @returns A new Job with all system-managed fields populated.
 */
export function createJobFromDraft(draft: JobDraft): Job {
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    ...draft,
    priority: draft.priority ?? 'Medium',
    createdAt: now,
    updatedAt: now,
  }
}
