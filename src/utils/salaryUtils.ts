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
