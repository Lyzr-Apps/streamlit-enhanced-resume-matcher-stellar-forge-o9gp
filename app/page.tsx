'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { FiZap, FiRefreshCw, FiStar, FiFileText } from 'react-icons/fi'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import UploadSection from '@/components/resumeiq/UploadSection'
import LoadingState from '@/components/resumeiq/LoadingState'
import TopMatchBanner from '@/components/resumeiq/TopMatchBanner'
import CategoryScoreCard from '@/components/resumeiq/CategoryScoreCard'
import CategoryDetail from '@/components/resumeiq/CategoryDetail'
import SkillBadge from '@/components/resumeiq/SkillBadge'

// --- Types ---
interface LearningRecommendation {
  skill: string
  resource: string
  type: string
}

interface CategoryAnalysis {
  name: string
  match_score: number
  missing_skills: string[]
  skills_to_improve: string[]
  experience_level: string
  experience_rationale: string
  learning_recommendations: LearningRecommendation[]
}

interface TopMatch {
  category: string
  score: number
  summary: string
}

interface ResumeAnalysis {
  top_match: TopMatch
  categories: CategoryAnalysis[]
  overall_summary: string
  strongest_skills: string[]
}

// --- Constants ---
const AGENT_ID = '69a1bbfb94f34c9b935dc502'

const SAMPLE_DATA: ResumeAnalysis = {
  top_match: {
    category: 'Software Engineering',
    score: 82,
    summary: 'Strong match due to extensive Python and JavaScript experience with production-level projects and solid understanding of REST APIs and database management.',
  },
  categories: [
    {
      name: 'Software Engineering',
      match_score: 82,
      missing_skills: ['System Design', 'GraphQL', 'Microservices Architecture'],
      skills_to_improve: ['Testing frameworks', 'CI/CD pipelines', 'Code review practices'],
      experience_level: 'Mid',
      experience_rationale: '3 years of professional experience with multiple shipped projects and demonstrated ability to work independently.',
      learning_recommendations: [
        { skill: 'System Design', resource: 'Designing Data-Intensive Applications by Martin Kleppmann', type: 'Book' },
        { skill: 'GraphQL', resource: 'Full-Stack GraphQL with Apollo', type: 'Course' },
      ],
    },
    {
      name: 'Data Science',
      match_score: 58,
      missing_skills: ['Machine Learning', 'Statistical Analysis', 'Data Visualization'],
      skills_to_improve: ['Python for data analysis', 'SQL optimization'],
      experience_level: 'Junior',
      experience_rationale: 'Limited exposure to data science workflows, but strong programming foundation to build upon.',
      learning_recommendations: [
        { skill: 'Machine Learning', resource: 'Andrew Ng Machine Learning Specialization on Coursera', type: 'Course' },
        { skill: 'Statistical Analysis', resource: 'Think Stats by Allen B. Downey', type: 'Book' },
      ],
    },
    {
      name: 'Product Management',
      match_score: 45,
      missing_skills: ['Product Strategy', 'User Research', 'Roadmap Planning', 'A/B Testing'],
      skills_to_improve: ['Stakeholder communication', 'Data-driven decision making'],
      experience_level: 'Junior',
      experience_rationale: 'No direct PM experience, but technical background provides a strong foundation for technical PM roles.',
      learning_recommendations: [
        { skill: 'Product Strategy', resource: 'Inspired by Marty Cagan', type: 'Book' },
      ],
    },
    {
      name: 'UX Design',
      match_score: 30,
      missing_skills: ['Figma', 'User Testing', 'Information Architecture', 'Prototyping'],
      skills_to_improve: ['UI design fundamentals'],
      experience_level: 'Entry',
      experience_rationale: 'Minimal design experience. Would require significant upskilling.',
      learning_recommendations: [
        { skill: 'Figma', resource: 'Figma for UX Design Course on Udemy', type: 'Course' },
      ],
    },
    {
      name: 'DevOps/Cloud Engineering',
      match_score: 65,
      missing_skills: ['Kubernetes', 'Terraform', 'Cloud Architecture'],
      skills_to_improve: ['Docker', 'AWS services', 'Monitoring tools'],
      experience_level: 'Junior',
      experience_rationale: 'Basic experience with deployment and CI/CD, but lacks deep cloud infrastructure knowledge.',
      learning_recommendations: [
        { skill: 'Kubernetes', resource: 'Kubernetes Up and Running by Kelsey Hightower', type: 'Book' },
        { skill: 'Terraform', resource: 'HashiCorp Terraform Associate Certification', type: 'Certification' },
      ],
    },
    {
      name: 'Cybersecurity',
      match_score: 35,
      missing_skills: ['Network Security', 'Penetration Testing', 'SIEM Tools', 'Compliance'],
      skills_to_improve: ['Security best practices', 'Authentication systems'],
      experience_level: 'Entry',
      experience_rationale: 'No dedicated security experience. Basic awareness of web security only.',
      learning_recommendations: [
        { skill: 'Network Security', resource: 'CompTIA Security+ Certification', type: 'Certification' },
      ],
    },
    {
      name: 'Mobile Development',
      match_score: 52,
      missing_skills: ['React Native', 'Swift', 'Kotlin', 'Mobile UX patterns'],
      skills_to_improve: ['JavaScript for mobile', 'State management'],
      experience_level: 'Junior',
      experience_rationale: 'Web development experience translates partially, but no direct mobile app experience.',
      learning_recommendations: [
        { skill: 'React Native', resource: 'React Native - The Practical Guide on Udemy', type: 'Course' },
      ],
    },
    {
      name: 'Project Management',
      match_score: 40,
      missing_skills: ['Agile Methodology', 'Risk Management', 'Budget Planning', 'PMP Knowledge'],
      skills_to_improve: ['Team coordination', 'Sprint planning'],
      experience_level: 'Entry',
      experience_rationale: 'No formal project management experience or certifications.',
      learning_recommendations: [
        { skill: 'Agile Methodology', resource: 'Scrum.org Professional Scrum Master I', type: 'Certification' },
      ],
    },
  ],
  overall_summary:
    'The candidate shows strong technical foundations with particular strength in backend development and web technologies. Python and JavaScript proficiency are standout skills. Best suited for Software Engineering roles, with potential to grow into DevOps/Cloud Engineering. Data Science and Mobile Development are secondary options that could be pursued with focused upskilling.',
  strongest_skills: ['Python', 'JavaScript', 'SQL', 'REST APIs', 'Git'],
}

// --- ErrorBoundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Markdown Renderer ---
function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// --- Main Page ---
export default function Page() {
  // App state
  type AppView = 'upload' | 'loading' | 'results'
  const [view, setView] = useState<AppView>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [analysisData, setAnalysisData] = useState<ResumeAnalysis | null>(null)
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showSampleData, setShowSampleData] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Derived data
  const displayData = showSampleData ? SAMPLE_DATA : analysisData
  const categories = useMemo(() => {
    return Array.isArray(displayData?.categories) ? displayData.categories : []
  }, [displayData])
  const strongestSkills = useMemo(() => {
    return Array.isArray(displayData?.strongest_skills) ? displayData.strongest_skills : []
  }, [displayData])
  const selectedCategory = selectedCategoryIndex !== null && categories[selectedCategoryIndex]
    ? categories[selectedCategoryIndex]
    : null

  // Handlers
  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file)
    setErrorMessage(null)
  }, [])

  const handleClearFile = useCallback(() => {
    setSelectedFile(null)
    setErrorMessage(null)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setErrorMessage(null)

    try {
      // Upload the PDF
      const uploadResult = await uploadFiles(selectedFile)
      if (!uploadResult.success) {
        setErrorMessage(uploadResult.error ?? 'Failed to upload file. Please try again.')
        setIsUploading(false)
        return
      }

      const assetIds = Array.isArray(uploadResult.asset_ids) ? uploadResult.asset_ids : []
      if (assetIds.length === 0) {
        setErrorMessage('Upload succeeded but no asset IDs returned. Please try again.')
        setIsUploading(false)
        return
      }

      setIsUploading(false)
      setView('loading')
      setActiveAgentId(AGENT_ID)

      // Call the agent
      const result = await callAIAgent(
        'Analyze this resume against the following job categories: Software Engineering, Data Science, Product Management, UX Design, DevOps/Cloud Engineering, Cybersecurity, Mobile Development, and Project Management. Provide match scores, missing skills, skills to improve, experience level assessment, and learning recommendations for each category.',
        AGENT_ID,
        { assets: assetIds }
      )

      setActiveAgentId(null)

      if (result.success) {
        const rawResult = result.response?.result
        let parsed: ResumeAnalysis | null = null

        if (typeof rawResult === 'string') {
          parsed = parseLLMJson(rawResult) as ResumeAnalysis | null
        } else if (rawResult && typeof rawResult === 'object') {
          if (rawResult.top_match || rawResult.categories) {
            parsed = rawResult as ResumeAnalysis
          } else {
            parsed = parseLLMJson(rawResult) as ResumeAnalysis | null
          }
        }

        if (parsed && (parsed.top_match || parsed.categories)) {
          setAnalysisData(parsed)
          setView('results')
          setSelectedCategoryIndex(null)
        } else {
          setErrorMessage('Could not parse the analysis results. Please try again.')
          setView('upload')
        }
      } else {
        setErrorMessage(result.error ?? 'Analysis failed. Please try again.')
        setView('upload')
      }
    } catch (err) {
      setActiveAgentId(null)
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setView('upload')
    }
  }, [selectedFile])

  const handleReset = useCallback(() => {
    setView('upload')
    setSelectedFile(null)
    setAnalysisData(null)
    setSelectedCategoryIndex(null)
    setErrorMessage(null)
    setShowSampleData(false)
    setActiveAgentId(null)
  }, [])

  const handleToggleSampleData = useCallback((checked: boolean) => {
    setShowSampleData(checked)
    if (checked && view === 'upload') {
      setView('results')
    }
    if (!checked && !analysisData) {
      setView('upload')
      setSelectedCategoryIndex(null)
    }
  }, [view, analysisData])

  // Determine effective view
  const effectiveView = showSampleData && view === 'upload' ? 'results' : view

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground font-sans">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-[12px] bg-background/80 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[hsl(142,60%,35%)] flex items-center justify-center">
                <FiZap className="text-white" size={18} />
              </div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight font-sans">ResumeIQ</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">
                  Sample Data
                </Label>
                <Switch
                  id="sample-toggle"
                  checked={showSampleData}
                  onCheckedChange={handleToggleSampleData}
                />
              </div>

              {effectiveView === 'results' && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs border-border hover:bg-secondary"
                >
                  <FiRefreshCw size={14} />
                  New Analysis
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-red-400 text-sm">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-400/70 text-xs mt-1 underline hover:text-red-400"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Upload View */}
          {effectiveView === 'upload' && (
            <UploadSection
              onFileSelected={handleFileSelected}
              selectedFile={selectedFile}
              onClearFile={handleClearFile}
              onAnalyze={handleAnalyze}
              isUploading={isUploading}
            />
          )}

          {/* Loading View */}
          {effectiveView === 'loading' && <LoadingState />}

          {/* Results View */}
          {effectiveView === 'results' && displayData && (
            <div className="space-y-6">
              {/* Top Match Banner */}
              <TopMatchBanner topMatch={displayData?.top_match} />

              {/* Overall Summary */}
              <div className="rounded-lg backdrop-blur-[8px] bg-card/85 border border-white/[0.18] p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FiFileText className="text-[hsl(142,60%,35%)]" size={16} />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Overall Summary
                  </h3>
                </div>
                <div className="text-muted-foreground text-sm leading-relaxed">
                  {renderMarkdown(displayData?.overall_summary ?? '')}
                </div>

                {/* Strongest Skills */}
                {strongestSkills.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <FiStar className="text-amber-400" size={14} />
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Strongest Skills
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {strongestSkills.map((skill, idx) => (
                        <SkillBadge key={idx} label={skill ?? ''} variant="strength" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Category Score Cards Grid */}
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                  Category Matches
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {categories.map((cat, idx) => (
                    <CategoryScoreCard
                      key={idx}
                      name={cat?.name ?? 'Unknown'}
                      matchScore={typeof cat?.match_score === 'number' ? cat.match_score : 0}
                      experienceLevel={cat?.experience_level ?? 'N/A'}
                      isSelected={selectedCategoryIndex === idx}
                      onClick={() =>
                        setSelectedCategoryIndex(selectedCategoryIndex === idx ? null : idx)
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Category Detail Panel */}
              {selectedCategory && (
                <div className="transition-all duration-300">
                  <CategoryDetail category={selectedCategory} />
                </div>
              )}

              {/* Reset Button */}
              {!showSampleData && (
                <div className="text-center pt-4">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="gap-2 border-border hover:bg-secondary"
                  >
                    <FiRefreshCw size={14} />
                    Upload New Resume
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Agent Info Footer */}
        <footer className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
          <div className="rounded-lg backdrop-blur-[8px] bg-card/85 border border-white/[0.18] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${activeAgentId ? 'bg-[hsl(142,60%,35%)] animate-pulse' : 'bg-muted-foreground/40'}`} />
                <div>
                  <p className="text-xs font-medium text-foreground">Resume Analysis Agent</p>
                  <p className="text-[10px] text-muted-foreground">
                    {activeAgentId ? 'Analyzing...' : 'Ready'} | JSON Agent | ID: {AGENT_ID.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                {activeAgentId ? 'Active' : 'Idle'}
              </Badge>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
