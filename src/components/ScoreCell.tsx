// Displays the calculated AI job score with color-coded output (low/medium/high) and loading state.
import type { Job } from '../domain'
import { calculateJobScore, DEFAULT_SCORE_WEIGHTS, type ScoreWeights } from '../services/scoring'

interface ScoreCellProps {
  job: Job
  weights?: ScoreWeights
}

export function ScoreCell({ job, weights = DEFAULT_SCORE_WEIGHTS }: ScoreCellProps) {
  if (job.aiScoringInProgress) {
    return (
      <span className="score-pending" title="AI scoring is currently running">
        AI scoring...
      </span>
    )
  }

  const score = calculateJobScore(job, weights)

  if (score === null) {
    return <span className="score-empty">—</span>
  }

  // Color code scores: 0-2 (low), 2-3.5 (medium), 3.5-5 (high)
  const scoreClass =
    score >= 3.5 ? 'score-high' : score >= 2 ? 'score-medium' : 'score-low'

  return (
    <span className={`score ${scoreClass}`} title={`Score: ${score.toFixed(2)}`}>
      {score.toFixed(1)}
    </span>
  )
}
