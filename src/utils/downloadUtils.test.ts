import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as downloadUtils from './downloadUtils'

function setupDownloadHarness() {
  const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
  const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const appendChildSpy = vi.spyOn(document.body, 'appendChild')
  const removeChildSpy = vi.spyOn(document.body, 'removeChild')

  const link = document.createElement('a')
  const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {})
  const originalCreateElement = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName.toLowerCase() === 'a') {
      return link
    }
    return originalCreateElement(tagName)
  })

  return {
    createObjectURL,
    revokeObjectURL,
    appendChildSpy,
    removeChildSpy,
    link,
    clickSpy,
  }
}

describe('downloadUtils', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('downloadFile creates blob URL, clicks link, and revokes URL', async () => {
    const { createObjectURL, revokeObjectURL, appendChildSpy, removeChildSpy, link, clickSpy } = setupDownloadHarness()

    downloadUtils.downloadFile('a,b\n1,2', 'jobs.csv', 'text/csv')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const createdBlob = createObjectURL.mock.calls[0][0] as Blob
    expect(createdBlob.type).toBe('text/csv')
    await expect(createdBlob.text()).resolves.toBe('a,b\n1,2')
    expect(link.download).toBe('jobs.csv')
    expect(link.href).toBe('blob:mock-url')
    expect(appendChildSpy).toHaveBeenCalledWith(link)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(removeChildSpy).toHaveBeenCalledWith(link)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('downloadTextFile uses text/plain and default filename', async () => {
    const { createObjectURL, link } = setupDownloadHarness()

    downloadUtils.downloadTextFile('hello')

    const createdBlob = createObjectURL.mock.calls[0][0] as Blob
    expect(createdBlob.type).toBe('text/plain')
    await expect(createdBlob.text()).resolves.toBe('hello')
    expect(link.download).toBe('file.txt')
  })

  it('downloadTextFile supports custom filename', () => {
    const { link } = setupDownloadHarness()

    downloadUtils.downloadTextFile('hello', 'notes.txt')

    expect(link.download).toBe('notes.txt')
  })

  it('downloadJsonFile string passthrough uses application/json', async () => {
    const { createObjectURL, link } = setupDownloadHarness()

    downloadUtils.downloadJsonFile('{"ok":true}', 'data.json')

    const createdBlob = createObjectURL.mock.calls[0][0] as Blob
    expect(createdBlob.type).toBe('application/json')
    await expect(createdBlob.text()).resolves.toBe('{"ok":true}')
    expect(link.download).toBe('data.json')
  })

  it('downloadJsonFile object input stringifies with indentation', async () => {
    const { createObjectURL } = setupDownloadHarness()

    downloadUtils.downloadJsonFile({ ok: true }, 'data.json')

    const createdBlob = createObjectURL.mock.calls[0][0] as Blob
    await expect(createdBlob.text()).resolves.toBe('{\n  "ok": true\n}')
  })

  it('downloadJsonFile defaults filename to data.json', () => {
    const { link } = setupDownloadHarness()

    downloadUtils.downloadJsonFile({ count: 1 })

    expect(link.download).toBe('data.json')
  })

  it('downloadCsvFile uses text/csv and default filename', async () => {
    const { createObjectURL, link } = setupDownloadHarness()

    downloadUtils.downloadCsvFile('a,b\n1,2')

    const createdBlob = createObjectURL.mock.calls[0][0] as Blob
    expect(createdBlob.type).toBe('text/csv')
    await expect(createdBlob.text()).resolves.toBe('a,b\n1,2')
    expect(link.download).toBe('data.csv')
  })

  it('downloadCsvFile supports custom filename', () => {
    const { link } = setupDownloadHarness()

    downloadUtils.downloadCsvFile('a,b\n1,2', 'jobs-export.csv')

    expect(link.download).toBe('jobs-export.csv')
  })
})
