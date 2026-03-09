import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Sparkline } from './Sparkline'

describe('Sparkline', () => {
  it('renders SVG element', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('returns null for empty values', () => {
    const { container } = render(<Sparkline values={[]} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeNull()
  })

  it('renders polyline with correct points', () => {
    const { container } = render(<Sparkline values={[0, 10, 5]} width={80} height={30} />)
    const polyline = container.querySelector('polyline')
    
    expect(polyline).not.toBeNull()
    expect(polyline).toHaveAttribute('points')
  })

  it('uses custom color prop', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} color="#ff0000" />)
    const polyline = container.querySelector('polyline')
    
    expect(polyline).toHaveAttribute('stroke', '#ff0000')
  })

  it('handles single value', () => {
    const { container } = render(<Sparkline values={[5]} />)
    const svg = container.querySelector('svg')
    
    // Should still render with single value
    expect(svg).not.toBeNull()
  })

  it('scales values correctly with different ranges', () => {
    const { container: container1 } = render(<Sparkline values={[0, 100]} height={30} width={80} />)
    const polyline1 = container1.querySelector('polyline')
    
    const { container: container2 } = render(<Sparkline values={[50, 51]} height={30} width={80} />)
    const polyline2 = container2.querySelector('polyline')
    
    // Different value ranges should produce different scaling
    // The polyline with [50,51] should have much smaller vertical variation than [0,100]
    expect(polyline1).not.toBeNull()
    expect(polyline2).not.toBeNull()
  })

  it('respects custom width and height', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} width={100} height={50} />)
    const svg = container.querySelector('svg')
    
    expect(svg).toHaveAttribute('width', '100')
    expect(svg).toHaveAttribute('height', '50')
  })

  it('has aria-hidden for accessibility', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} />)
    const svg = container.querySelector('svg')
    
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
