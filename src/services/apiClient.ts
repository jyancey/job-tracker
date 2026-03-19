// Re-exports API job fetching and persisting functions from the storage layer.
export {
  fetchJobs,
  isApiUrlPatternError,
  persistJobs,
} from '../storage/jobsApi'