export const JOB_STATUSES = [
  'Wishlist',
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
] as const

export type JobStatus = (typeof JOB_STATUSES)[number]

export interface Job {
  id: string
  company: string
  roleTitle: string
  applicationDate: string
  status: JobStatus
  jobUrl: string
  atsUrl: string
  salaryRange: string
  notes: string
  contactPerson: string
  nextAction: string
  nextActionDueDate: string
  createdAt: string
  updatedAt: string
  // Job description for AI analysis
  jobDescription?: string
  jobDescriptionSource?: 'url' | 'paste' | 'upload' | 'scraped'
  // Optional scoring fields (0-5 scale)
  scoreFit?: number
  scoreCompensation?: number
  scoreLocation?: number
  scoreGrowth?: number
  scoreConfidence?: number
  // AI scoring metadata
  aiScoredAt?: string
  aiModel?: string
  aiReasoning?: string
}

export type JobDraft = Omit<Job, 'id' | 'createdAt' | 'updatedAt'>

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
}

export function createJobFromDraft(draft: JobDraft): Job {
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    ...draft,
    createdAt: now,
    updatedAt: now,
  }
}
