/**
 * Calendar utilities for date math, formatting, and calculations
 * Extracted from CalendarView for reuse in other calendar-based components
 */

/**
 * Parse a date string in YYYY-MM-DD format to a Date object
 * @param dateStr - Date string in YYYY-MM-DD format (e.g., "2025-03-15")
 * @returns Date object set to midnight UTC
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Format date components to YYYY-MM-DD string
 * @param year - Full year
 * @param month - Month (0-11)
 * @param day - Day of month
 * @returns Formatted date string
 */
export function getDateString(year: number, month: number, day: number): string {
  const dateObj = new Date(year, month, day)
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Get the number of days in a given month
 * @param date - Any date in the target month
 * @returns Number of days in the month
 */
export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

/**
 * Get the first day of the month (0 = Sunday, 6 = Saturday)
 * @param date - Any date in the target month
 * @returns Day of week for first day of month (0-6)
 */
export function getFirstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
}

/**
 * Check if a date string (YYYY-MM-DD) is before today
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns true if dateStr is before today (overdue)
 */
export function isDateOverdue(dateStr: string): boolean {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  return dateStr < todayStr
}

/**
 * Get today's date as YYYY-MM-DD string
 * @returns Today's date formatted as YYYY-MM-DD
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Generate calendar grid for a month (including empty slots for boundary days)
 * @param date - Any date in the target month
 * @returns Array of day numbers (1-31) and null for empty grid cells
 */
export function generateCalendarGrid(date: Date): (number | null)[] {
  const daysInMonth = getDaysInMonth(date)
  const firstDay = getFirstDayOfMonth(date)
  const calendarDays: (number | null)[] = []

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  return calendarDays
}

/**
 * Get month name for a date
 * @param date - Any date in the target month
 * @returns Name of month (e.g., "March")
 */
export function getMonthName(date: Date): string {
  return date.toLocaleString('default', { month: 'long' })
}

/**
 * Format date object to YYYY-MM-DD string
 * @param date - Date object to format
 * @returns Formatted date string
 */
export function formatDateToString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
