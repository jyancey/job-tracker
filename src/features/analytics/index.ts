// Pipeline analytics module
export {
  calculateConversionMetrics,
  calculateWeeklyTrends,
  calculateStatusDistribution,
  type ConversionMetrics,
  type WeeklyTrends,
  type StatusDistribution,
} from './pipelineMetrics'

export {
  calculateDaysInCurrentStatus,
  calculateTimeInStage,
  findStuckJobs,
  countStuckJobsByStatus,
  DEFAULT_STUCK_THRESHOLDS,
  type TimeInStageMetrics,
  type StuckJob,
  type StuckThresholds,
} from './timeInStage'
