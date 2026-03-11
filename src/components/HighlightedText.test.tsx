import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HighlightedText } from './HighlightedText'

describe('HighlightedText', () => {
  it('renders plain text when no query provided', () => {
    const { container } = render(<HighlightedText text="Hello World" query="" />)
    expect(container.textContent).toBe('Hello World')
    expect(container.querySelectorAll('mark')).toHaveLength(0)
  })

  it('renders plain text when query is whitespace only', () => {
    const { container } = render(<HighlightedText text="Hello World" query="   " />)
    expect(container.textContent).toBe('Hello World')
    expect(container.querySelectorAll('mark')).toHaveLength(0)
  })

  it('highlights exact matches', () => {
    const { container } = render(<HighlightedText text="Hello World" query="World" />)
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe('World')
  })

  it('highlights case-insensitively', () => {
    const { container } = render(<HighlightedText text="Hello World" query="world" />)
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe('World')
  })

  it('highlights multiple matching tokens', () => {
    const { container } = render(<HighlightedText text="Hello World Hello" query="Hello World" />)
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(3) // 2 "Hello", 1 "World"
  })

  it('highlights multiple tokens with proper spacing', () => {
    const { container } = render(<HighlightedText text="The quick brown fox" query="quick brown" />)
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(2)
    expect(marks[0].textContent).toBe('quick')
    expect(marks[1].textContent).toBe('brown')
  })

  it('preserves original text case in output', () => {
    const { container } = render(<HighlightedText text="HeLLo WoRLd" query="hello world" />)
    expect(container.textContent).toBe('HeLLo WoRLd')
    const marks = container.querySelectorAll('mark')
    expect(marks[0].textContent).toBe('HeLLo')
    expect(marks[1].textContent).toBe('WoRLd')
  })

  it('escapes special regex characters', () => {
    const { container } = render(<HighlightedText text="Price: $99.99" query="$99.99" />)
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe('$99.99')
  })

  it('handles regex metacharacters in query', () => {
    const { container } = render(<HighlightedText text="Pattern: (a|b) and [c-d]" query="(a|b) [c-d]" />)
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(2)
  })

  it('highlights at word boundaries', () => {
    const { container } = render(<HighlightedText text="The theme is awesome" query="the" />)
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(2) // "The" and "theme"
  })

  it('handles single character queries', () => {
    const { container } = render(<HighlightedText text="aaa bbb aaa" query="a" />)
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(6) // 3 a's in first "aaa" + 3 a's in second "aaa"
  })

  it('handles queries with multiple spaces', () => {
    const { container } = render(<HighlightedText text="one two three four" query="two   three" />)
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(2)
    expect(marks[0].textContent).toBe('two')
    expect(marks[1].textContent).toBe('three')
  })

  it('handles empty text', () => {
    const { container } = render(<HighlightedText text="" query="hello" />)
    expect(container.textContent).toBe('')
    expect(container.querySelectorAll('mark')).toHaveLength(0)
  })

  it('applies search-highlight class to marks', () => {
    const { container } = render(<HighlightedText text="Hello World" query="Hello" />)
    const mark = container.querySelector('mark')
    expect(mark?.className).toBe('search-highlight')
  })

  it('does not split non-matching text', () => {
    const { container } = render(<HighlightedText text="no match here" query="xyz" />)
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(0)
    expect(container.textContent).toBe('no match here')
  })

  it('handles repeated tokens in query', () => {
    const { container } = render(<HighlightedText text="apple apple banana apple" query="apple apple" />)
    const marks = container.querySelectorAll('mark')
    // Should highlight all instances of "apple"
    expect(marks.length).toBeGreaterThan(0)
  })

  it('maintains document structure with mixed content', () => {
    const { container } = render(<HighlightedText text="The quick brown fox jumps" query="quick fox" />)
    const text = container.textContent
    expect(text).toBe('The quick brown fox jumps')
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(2)
  })
})
