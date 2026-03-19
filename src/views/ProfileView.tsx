// User profile editor with tech skills list, seniority level, and resume file parsing.
import { useRef, useState } from 'react'
import type { UserProfile } from '../types/ai'
import { loadUserProfile, saveUserProfile } from '../storage/aiStorage'
import { parseResumeFile, resumeToProfile } from '../services/resumeParsingService'

interface ProfileViewProps {
  onClose: () => void
}

const TECH_SKILLS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Python',
  'Node.js',
  'SQL',
  'PostgreSQL',
  'MongoDB',
  'AWS',
  'Docker',
  'GraphQL',
  'REST APIs',
  'CSS',
  'HTML',
  'Git',
  'Vue',
  'Angular',
  'Java',
  'C++',
  'Go',
  'Rust',
  'Kubernetes',
  'CI/CD',
  'Agile',
  'TDD',
  'Product Design',
  'UX Design',
  'Figma',
  'Project Management',
  'Data Analysis',
]

export function ProfileView({ onClose }: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile())
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const resumeFileRef = useRef<HTMLInputElement>(null)

  const handleProfileFieldChange = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
    setError('')
  }

  const handleSkillToggle = (skill: string) => {
    setProfile((prev) => {
      const skills = prev.skills || []
      const updated = skills.includes(skill)
        ? skills.filter((s) => s !== skill)
        : [...skills, skill]
      return { ...prev, skills: updated }
    })
    setSaved(false)
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')

    try {
      const parsed = await parseResumeFile(file)
      const newProfile = resumeToProfile(parsed)
      setProfile((prev) => ({ ...prev, ...newProfile, updatedAt: new Date().toISOString() }))
      setSaved(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume')
    } finally {
      setLoading(false)
      if (resumeFileRef.current) {
        resumeFileRef.current.value = ''
      }
    }
  }

  const handleSaveProfile = () => {
    try {
      const profileToSave: UserProfile = {
        ...profile,
        updatedAt: new Date().toISOString(),
      }
      saveUserProfile(profileToSave)
      setSaved(true)
      setError('')
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    }
  }

  return (
    <div className="profile-view-container">
      <header className="profile-view-header">
        <h1>Your Profile</h1>
        <button className="close-button" onClick={onClose} title="Close">
          ✕
        </button>
      </header>

      <div className="profile-content">
        <div className="profile-tab">
            <div className="settings-section">
              <h2>Basic Information</h2>

              <label className="full-width">
                Name
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={(e) => handleProfileFieldChange('name', e.target.value)}
                  placeholder="Your full name"
                />
              </label>

              <label className="full-width">
                Current Role
                <input
                  type="text"
                  value={profile.currentRole || ''}
                  onChange={(e) => handleProfileFieldChange('currentRole', e.target.value)}
                  placeholder="e.g., Senior Product Designer"
                />
              </label>

              <label className="half-width">
                Years of Experience
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={profile.yearsExperience || ''}
                  onChange={(e) =>
                    handleProfileFieldChange(
                      'yearsExperience',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="e.g., 5"
                />
              </label>

              <label className="half-width">
                Preferred Company Size
                <select
                  value={profile.preferredCompanySize || ''}
                  onChange={(e) =>
                    handleProfileFieldChange('preferredCompanySize', e.target.value || undefined)
                  }
                >
                  <option value="">No preference</option>
                  <option value="startup">Startup (&lt;50)</option>
                  <option value="small">Small (50-200)</option>
                  <option value="medium">Medium (200-1000)</option>
                  <option value="large">Large (1000+)</option>
                </select>
              </label>
            </div>

            <div className="settings-section">
              <h2>Preferences</h2>

              <label className="full-width">
                Preferred Location
                <input
                  type="text"
                  value={profile.preferredLocation || ''}
                  onChange={(e) => handleProfileFieldChange('preferredLocation', e.target.value)}
                  placeholder="e.g., Remote, San Francisco, or anywhere"
                />
              </label>

              <label className="full-width">
                Salary Expectation
                <input
                  type="text"
                  value={profile.salaryExpectation || ''}
                  onChange={(e) => handleProfileFieldChange('salaryExpectation', e.target.value)}
                  placeholder="e.g., $120k - $150k"
                />
              </label>

              <label className="full-width">
                Target Industries (comma-separated)
                <input
                  type="text"
                  value={profile.targetIndustries?.join(', ') || ''}
                  onChange={(e) =>
                    handleProfileFieldChange(
                      'targetIndustries',
                      e.target.value ? e.target.value.split(',').map((s) => s.trim()) : undefined,
                    )
                  }
                  placeholder="e.g., Technology, Fintech, Healthcare"
                />
              </label>

              <label className="full-width">
                Preferred Roles (comma-separated)
                <input
                  type="text"
                  value={profile.preferredRoles?.join(', ') || ''}
                  onChange={(e) =>
                    handleProfileFieldChange(
                      'preferredRoles',
                      e.target.value ? e.target.value.split(',').map((s) => s.trim()) : undefined,
                    )
                  }
                  placeholder="e.g., Product Manager, Designer, Engineer"
                />
              </label>

              <label className="full-width">
                Career Goals
                <textarea
                  value={profile.careerGoals || ''}
                  onChange={(e) => handleProfileFieldChange('careerGoals', e.target.value)}
                  placeholder="What are your long-term career goals?"
                  rows={3}
                />
              </label>

              <label className="full-width">
                Deal Breakers (comma-separated)
                <input
                  type="text"
                  value={profile.dealBreakers?.join(', ') || ''}
                  onChange={(e) =>
                    handleProfileFieldChange(
                      'dealBreakers',
                      e.target.value ? e.target.value.split(',').map((s) => s.trim()) : undefined,
                    )
                  }
                  placeholder="e.g., Relocation required, No remote work, etc."
                />
              </label>
            </div>

            <div className="settings-section">
              <h2>Skills</h2>
              <div className="skills-grid">
                {TECH_SKILLS.map((skill) => (
                  <label key={skill} className="skill-checkbox">
                    <input
                      type="checkbox"
                      checked={profile.skills?.includes(skill) || false}
                      onChange={() => handleSkillToggle(skill)}
                    />
                    <span>{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <h2>Resume Upload</h2>
              <div className="resume-upload-area">
                <input
                  ref={resumeFileRef}
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleResumeUpload}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => resumeFileRef.current?.click()}
                  disabled={loading}
                >
                  {loading ? 'Parsing...' : 'Upload Resume (TXT or PDF)'}
                </button>
                <small>
                  Upload your resume to auto-populate your profile with skills, experience, and
                  contact info.
                </small>
                {profile.resumeText && (
                  <div className="resume-info">
                    <p>Resume text loaded ({profile.resumeText.length} characters)</p>
                    <button
                      type="button"
                      className="button-text"
                      onClick={() => handleProfileFieldChange('resumeText', undefined)}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {saved && <div className="success-message">Settings saved successfully</div>}

        <div className="profile-footer">
          <button type="button" className="button-secondary" onClick={onClose}>
            ← Back to Jobs
          </button>
          <button type="button" className="button-primary" onClick={handleSaveProfile}>
            Save Profile
          </button>
        </div>
      </div>
    </div>
  )
}
