// Compatibility facade re-exporting the split SQLite repository modules.
export { getAIConfig, saveAIConfig } from './sqlite/aiConfigRepository'
export { createJobStore } from './sqlite/jobsRepository'
export type { JobStore } from './sqlite/jobsRepository'
export { getUserProfile, saveUserProfile } from './sqlite/userProfileRepository'
