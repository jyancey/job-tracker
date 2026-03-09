interface HighlightedTextProps {
  text: string
  query: string
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function HighlightedText({ text, query }: HighlightedTextProps) {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) {
    return <>{text}</>
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  if (!tokens.length) {
    return <>{text}</>
  }

  const pattern = tokens.map(escapeRegExp).join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(regex)
  const lowerTokens = tokens.map((token) => token.toLowerCase())

  return (
    <>
      {parts.map((part, index) =>
        lowerTokens.some((token) => part.toLowerCase() === token) ? (
          <mark key={`${part}-${index}`} className="search-highlight">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  )
}
