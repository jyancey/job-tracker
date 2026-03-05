import { useCallback, useState } from 'react'
import type { ImportMode } from '../exportImport'

/**
 * Custom hook to manage import/export state and operations
 * Encapsulates file handling and import mode selection
 *
 * Returns:
 * - importMode: Current import merge strategy
 * - setImportMode: Change import mode
 * - importFileRef: Reference to hidden file input
 * - handleImportClick: Open file picker
 * - handleImportFile: Process selected file
 */

export function useImportExportState() {
  const [importMode, setImportMode] = useState<ImportMode>('append')
  const importFileRef = new Map<string, HTMLInputElement>()

  const getFileRef = useCallback((): HTMLInputElement | null => {
    // Create a temporary ref for import functionality
    // In actual usage, this will be provided by a ref from the component
    return null
  }, [])

  const updateImportMode = useCallback((mode: ImportMode) => {
    setImportMode(mode)
  }, [])

  return {
    importMode,
    updateImportMode,
    importFileRef,
    getFileRef,
  }
}
