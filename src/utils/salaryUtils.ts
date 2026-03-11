/**
 * Determine whether a job's salary range satisfies the given min/max filter bounds.
 *
 * Extracts the first numeric value from `salaryRange` (e.g. the leading figure
 * in `"$120k–$150k"`) and compares it against the bounds. If both bounds are
 * empty, all salary ranges are considered a match.
 *
 * @param salaryRange - The raw salary string from a job record.
 * @param minStr - Lower bound as a numeric string (e.g. `"100"`), or empty to skip.
 * @param maxStr - Upper bound as a numeric string (e.g. `"200"`), or empty to skip.
 * @returns `true` if the salary range satisfies the filter bounds.
 */
export function parseSalaryRange(salaryRange: string, minStr: string, maxStr: string): boolean {
  if (!minStr && !maxStr) return true
  if (!salaryRange) return false

  const numbers = salaryRange.match(/\d+/g) || []
  if (!numbers.length) return false

  const firstValue = numbers[0]
  if (!firstValue) return false

  const first = parseInt(firstValue, 10)
  const min = minStr ? parseInt(minStr, 10) : 0
  const max = maxStr ? parseInt(maxStr, 10) : Infinity

  return first >= min && first <= max
}
