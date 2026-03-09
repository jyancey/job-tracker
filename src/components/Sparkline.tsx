/**
 * Sparkline component for simple inline chart visualization
 * Renders a minimal SVG line chart within the trend cards
 */

interface SparklineProps {
  values: number[]
  height?: number
  width?: number
  color?: string
}

export function Sparkline({ values, height = 30, width = 80, color = '#2563eb' }: SparklineProps) {
  if (values.length === 0) {
    return null
  }

  // Calculate Y-axis scale
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const padding = 4

  // Calculate points
  const pointWidth = (width - padding * 2) / (values.length - 1 || 1)
  const points = values
    .map((value, index) => {
      const x = padding + index * pointWidth
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return { x, y, value }
    })
    .map((point) => `${point.x},${point.y}`)
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ marginLeft: '0.5rem' }}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
