/**
 * Consolidated download utility functions
 * Shared by storage and export/import modules
 */

/**
 * Programmatically download a file with the given content
 * @param content - The file content to download
 * @param filename - The name of the file to save
 * @param mimeType - The MIME type of the file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download text content as a plain text file
 * @param content - The text content
 * @param filename - The name of the file (default: file.txt)
 */
export function downloadTextFile(content: string, filename = 'file.txt'): void {
  downloadFile(content, filename, 'text/plain')
}

/**
 * Download JSON content as a JSON file
 * @param content - The JSON string or object
 * @param filename - The name of the file (default: data.json)
 */
export function downloadJsonFile(content: string | object, filename = 'data.json'): void {
  const jsonString = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  downloadFile(jsonString, filename, 'application/json')
}

/**
 * Download CSV content as a CSV file
 * @param content - The CSV string
 * @param filename - The name of the file (default: data.csv)
 */
export function downloadCsvFile(content: string, filename = 'data.csv'): void {
  downloadFile(content, filename, 'text/csv')
}
