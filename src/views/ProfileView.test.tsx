import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileView } from './ProfileView'
import type { UserProfile } from '../types/ai'

vi.mock('../storage/aiStorage', () => ({
  loadUserProfile: vi.fn(),
  saveUserProfile: vi.fn(),
}))

vi.mock('../services/resumeParsingService', () => ({
  parseResumeFile: vi.fn(),
  resumeToProfile: vi.fn(),
}))

import { loadUserProfile, saveUserProfile } from '../storage/aiStorage'
import { parseResumeFile, resumeToProfile } from '../services/resumeParsingService'

const baseProfile: UserProfile = {
  name: 'Jane Doe',
  currentRole: 'Product Engineer',
  skills: ['React'],
  preferredRoles: ['Engineer'],
  targetIndustries: ['Technology'],
  dealBreakers: [],
}

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadUserProfile).mockReturnValue({ ...baseProfile })
  })

  it('renders with loaded profile data', () => {
    render(<ProfileView onClose={vi.fn()} />)

    expect(screen.getAllByRole('heading', { name: 'Your Profile' }).length).toBeGreaterThan(0)
    expect(screen.getAllByDisplayValue('Jane Doe').length).toBeGreaterThan(0)
    expect(screen.getAllByDisplayValue('Product Engineer').length).toBeGreaterThan(0)
  })

  it('calls onClose from header close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    const { container } = render(<ProfileView onClose={onClose} />)

    const closeBtn = container.querySelector('.profile-view-header .close-button') as HTMLButtonElement
    await user.click(closeBtn)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('saves profile when Save Profile is clicked', async () => {
    const user = userEvent.setup()

    render(<ProfileView onClose={vi.fn()} />)

    const nameInput = screen.getAllByLabelText('Name')[0]
    await user.clear(nameInput)
    await user.type(nameInput, 'Janet Doe')

    await user.click(screen.getAllByRole('button', { name: 'Save Profile' })[0])

    expect(saveUserProfile).toHaveBeenCalled()
    expect(screen.getAllByText('Settings saved successfully').length).toBeGreaterThan(0)
  })

  it('shows error message when save fails', async () => {
    const user = userEvent.setup()
    vi.mocked(saveUserProfile).mockImplementationOnce(() => {
      throw new Error('save failed')
    })

    render(<ProfileView onClose={vi.fn()} />)

    await user.click(screen.getAllByRole('button', { name: 'Save Profile' })[0])

    expect(screen.getAllByText('save failed').length).toBeGreaterThan(0)
  })

  it('updates skill selection via checkbox toggles', async () => {
    const user = userEvent.setup()

    render(<ProfileView onClose={vi.fn()} />)

    const pythonCheckbox = screen.getAllByRole('checkbox', { name: 'Python' })[0]
    expect(pythonCheckbox).not.toBeChecked()

    await user.click(pythonCheckbox)
    expect(pythonCheckbox).toBeChecked()

    await user.click(screen.getAllByRole('button', { name: 'Save Profile' })[0])
    expect(saveUserProfile).toHaveBeenCalled()
  })

  it('uploads resume and merges parsed profile fields', async () => {
    vi.mocked(parseResumeFile).mockResolvedValueOnce({
      skills: ['TypeScript'],
      workHistory: [],
      education: [],
      rawText: 'resume text',
      name: 'Resume Name',
    })
    vi.mocked(resumeToProfile).mockReturnValueOnce({
      name: 'Resume Name',
      currentRole: 'Engineer',
      yearsExperience: 5,
      skills: ['TypeScript', 'React'],
      resumeText: 'resume text',
    })

    const { container } = render(<ProfileView onClose={vi.fn()} />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['resume body'], 'resume.txt', { type: 'text/plain' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(parseResumeFile).toHaveBeenCalled()
    })

    expect(screen.getAllByText(/Resume text loaded/).length).toBeGreaterThan(0)
  })

  it('shows error when resume parsing fails', async () => {
    vi.mocked(parseResumeFile).mockRejectedValueOnce(new Error('Failed to parse resume file'))

    const { container } = render(<ProfileView onClose={vi.fn()} />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['bad'], 'resume.txt', { type: 'text/plain' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getAllByText('Failed to parse resume file').length).toBeGreaterThan(0)
    })
  })
})
