'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { cn } from '@/lib/utils'
import { FiSearch, FiEdit3, FiMail, FiMessageSquare, FiUploadCloud, FiX, FiFile, FiCopy, FiCheck, FiChevronDown, FiChevronUp, FiRefreshCw, FiTarget, FiAlertCircle, FiArrowRight } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'

// ============================================================
// TYPES
// ============================================================
interface ScoreBreakdown {
  keyword_match: number
  skills_match: number
  experience_relevance: number
  education_match: number
}

interface ATSData {
  ats_score: number
  score_breakdown: ScoreBreakdown
  matching_keywords: string[]
  missing_keywords: string[]
  skill_gaps: string[]
  strengths: string[]
  summary: string
}

interface OptimizedBullet {
  original: string
  optimized: string
  improvement_note: string
}

interface OptimizerData {
  optimized_summary: string
  optimized_bullets: OptimizedBullet[]
  suggested_skills: string[]
  improvement_tips: string[]
  overall_assessment: string
}

interface OutreachData {
  cover_letter: string
  linkedin_connection_note: string
  linkedin_message: string
  email_subject_lines: string[]
  tone_notes: string
}

interface InterviewQuestion {
  question: string
  why_asked?: string
  topic_area?: string
  scenario_type?: string
  suggested_approach: string
  key_points: string[]
}

interface InterviewData {
  behavioral_questions: InterviewQuestion[]
  technical_questions: InterviewQuestion[]
  situational_questions: InterviewQuestion[]
  general_tips: string[]
  preparation_summary: string
}

interface AgentStatus {
  loading: boolean
  error: string | null
  data: any | null
}

// ============================================================
// CONSTANTS
// ============================================================
const AGENTS = {
  ats: '69a1bf41fd4a0d8eaf318fe7',
  optimizer: '69a1bf4fabdc4bd23cd13a0a',
  outreach: '69a1bf5b27b2efe3a887dab7',
  interview: '69a1bf6b63cead3f400eb1f5',
}

const AGENT_INFO = [
  { key: 'ats', name: 'ATS Analyzer', desc: 'Resume-JD matching & scoring', icon: FiSearch, id: AGENTS.ats },
  { key: 'optimizer', name: 'Resume Optimizer', desc: 'Content enhancement & rewriting', icon: FiEdit3, id: AGENTS.optimizer },
  { key: 'outreach', name: 'Outreach Writer', desc: 'Cover letter & LinkedIn drafts', icon: FiMail, id: AGENTS.outreach },
  { key: 'interview', name: 'Interview Coach', desc: 'Question preparation & tips', icon: FiMessageSquare, id: AGENTS.interview },
]

// ============================================================
// SAMPLE DATA
// ============================================================
const SAMPLE_ATS: ATSData = {
  ats_score: 72,
  score_breakdown: { keyword_match: 65, skills_match: 78, experience_relevance: 80, education_match: 70 },
  matching_keywords: ['Python', 'Machine Learning', 'Data Analysis', 'SQL', 'REST APIs', 'Agile', 'Git', 'Docker'],
  missing_keywords: ['Kubernetes', 'CI/CD', 'Terraform', 'GraphQL', 'TypeScript'],
  skill_gaps: ['Cloud infrastructure experience', 'DevOps practices', 'Infrastructure as Code'],
  strengths: ['Strong technical background in Python and ML', 'Relevant project experience with data pipelines', 'Solid understanding of software engineering principles', 'Good communication skills demonstrated in projects'],
  summary: 'Your resume shows a solid foundation with a 72% ATS match score. The keyword alignment is moderate at 65%, indicating room to incorporate more job-specific terminology. Your skills match is strong at 78%, and experience relevance scores well at 80%. Focus on adding missing cloud and DevOps keywords to push your score above 80%.',
}

const SAMPLE_OPTIMIZER: OptimizerData = {
  optimized_summary: 'Results-driven software engineer with 5+ years of experience building scalable full-stack applications and data-driven solutions. Proven track record of delivering high-impact features that improved user engagement by 35% and reduced processing time by 50%. Expertise in Python, JavaScript/TypeScript, and cloud technologies with a passion for machine learning and automation.',
  optimized_bullets: [
    {
      original: 'Worked on backend systems using Python',
      optimized: 'Architected and deployed scalable backend microservices using Python and FastAPI, handling 10K+ requests/second with 99.9% uptime',
      improvement_note: 'Added quantifiable metrics, specific technologies, and measurable impact to demonstrate scale and reliability',
    },
    {
      original: 'Built data pipelines for analytics',
      optimized: 'Designed and implemented end-to-end ETL data pipelines processing 2M+ records daily, reducing report generation time by 60% and enabling real-time business intelligence dashboards',
      improvement_note: 'Quantified data volume, added outcome metrics, and specified the business impact of the work',
    },
    {
      original: 'Collaborated with team members on projects',
      optimized: 'Led cross-functional collaboration with 3 engineering teams and product stakeholders to deliver a customer-facing feature that increased user retention by 25%',
      improvement_note: 'Replaced vague collaboration with specific leadership scope, team size, and measurable business outcome',
    },
  ],
  suggested_skills: ['Python', 'React', 'AWS', 'Docker', 'Kubernetes', 'TypeScript', 'PostgreSQL', 'Redis'],
  improvement_tips: [
    'Add more quantifiable achievements with specific numbers and percentages',
    'Include relevant certifications (AWS, Google Cloud, or Azure)',
    'Tailor your skills section to mirror the exact keywords from the job description',
    'Add a "Key Achievements" section highlighting your top 3 accomplishments',
    'Use action verbs at the start of every bullet point',
  ],
  overall_assessment: 'Your resume has strong foundations with solid technical experience. The main areas for improvement are: (1) adding quantifiable results to every bullet point, (2) incorporating more job-specific keywords naturally into your experience descriptions, and (3) restructuring your skills section to prioritize the most relevant technologies for this role.',
}

const SAMPLE_OUTREACH: OutreachData = {
  cover_letter: "Dear Hiring Manager,\n\nI am writing to express my strong interest in the Software Engineer position at your company. With over 5 years of experience building scalable applications and data-driven solutions, I am confident that my technical expertise and collaborative approach make me an excellent fit for this role.\n\nIn my current position, I have architected backend microservices handling 10K+ requests per second, designed ETL pipelines processing 2M+ daily records, and led cross-functional teams to deliver features that increased user retention by 25%. These experiences have given me a deep understanding of building reliable, high-performance systems at scale.\n\nWhat excites me most about this opportunity is your team's commitment to innovation and technical excellence. I am particularly drawn to the challenge of working on products that impact millions of users, and I believe my background in both software engineering and data analysis positions me uniquely to contribute to your team's goals.\n\nI would welcome the opportunity to discuss how my experience and passion can contribute to your team's continued success. Thank you for considering my application.\n\nBest regards,\n[Your Name]",
  linkedin_connection_note: "Hi! I noticed your team is hiring for a Software Engineer role that closely aligns with my background in building scalable Python applications and data pipelines. I would love to connect and learn more about the team and culture!",
  linkedin_message: "Thank you for connecting! I recently applied for the Software Engineer position at your company and wanted to reach out directly. I have 5+ years of experience building high-performance backend systems and data solutions, and I am genuinely excited about the work your team is doing. I would love to chat briefly about the role if you have a few minutes. Looking forward to hearing from you!",
  email_subject_lines: [
    'Experienced Software Engineer - Application for Senior Backend Role',
    'Passionate Full-Stack Developer Ready to Contribute to [Company] Engineering Team',
    'Application: Software Engineer with 5+ Years in Scalable Systems',
    'Software Engineer with Data Pipeline Expertise - Excited About [Company]',
  ],
  tone_notes: 'Professional and confident tone with genuine enthusiasm for the role and company mission. The outreach balances technical credibility with personal warmth, avoiding overly formal language while maintaining professionalism.',
}

const SAMPLE_INTERVIEW: InterviewData = {
  behavioral_questions: [
    {
      question: 'Tell me about a time you had to lead a challenging project with tight deadlines.',
      why_asked: 'Assesses leadership, time management, and ability to deliver under pressure',
      suggested_approach: 'Use the STAR method: describe the Situation (tight deadline project), your Task (leading the team), Actions taken (prioritization, delegation, problem-solving), and Results achieved (on-time delivery with impact)',
      key_points: ['Highlight your leadership initiative and decision-making', 'Show measurable outcomes (timeline met, quality maintained)', 'Mention how you supported team members'],
    },
    {
      question: 'Describe a situation where you had to learn a new technology quickly to solve a problem.',
      why_asked: 'Evaluates adaptability, learning agility, and resourcefulness',
      suggested_approach: 'Focus on the urgency of the need, your learning strategy, and the successful application of the new technology',
      key_points: ['Demonstrate curiosity and proactive learning', 'Show practical application with real results', 'Mention resources you used (documentation, mentors, courses)'],
    },
    {
      question: 'Give an example of when you received critical feedback and how you handled it.',
      why_asked: 'Tests self-awareness, humility, and growth mindset',
      suggested_approach: 'Be honest about the feedback, show you listened without defensiveness, and demonstrate concrete changes you made',
      key_points: ['Show maturity in receiving feedback', 'Demonstrate specific improvements made', 'Mention follow-up actions and positive outcomes'],
    },
  ],
  technical_questions: [
    {
      question: 'How would you design a scalable API for handling high-traffic applications?',
      topic_area: 'System Design',
      suggested_approach: 'Start with requirements gathering, then discuss architecture (load balancing, caching, database sharding), scaling strategies (horizontal vs. vertical), and trade-offs',
      key_points: ['Load balancing strategies (round-robin, least connections)', 'Caching layers (Redis, CDN)', 'Database optimization and read replicas', 'Rate limiting and circuit breakers'],
    },
    {
      question: 'Explain how you would optimize a slow-running database query.',
      topic_area: 'Database Optimization',
      suggested_approach: 'Walk through your diagnostic process: EXPLAIN plan analysis, index optimization, query restructuring, and monitoring',
      key_points: ['Query execution plan analysis', 'Index creation and optimization', 'Query restructuring (avoiding N+1, using JOINs efficiently)', 'Connection pooling and caching strategies'],
    },
  ],
  situational_questions: [
    {
      question: 'What would you do if you disagreed with a technical decision made by your team lead?',
      scenario_type: 'Conflict Resolution',
      suggested_approach: 'Show respect for hierarchy while demonstrating ability to advocate for better solutions through data and evidence',
      key_points: ['Data-driven communication over opinion-based arguments', 'Private conversation before public disagreement', 'Willingness to commit even if your approach is not chosen'],
    },
    {
      question: 'How would you handle discovering a critical security vulnerability in production code?',
      scenario_type: 'Crisis Management',
      suggested_approach: 'Demonstrate urgency, proper escalation, and systematic incident response',
      key_points: ['Immediate assessment of impact scope', 'Escalation to security team and stakeholders', 'Implement temporary mitigation while working on permanent fix', 'Post-incident review and prevention measures'],
    },
  ],
  general_tips: [
    'Research the company thoroughly - understand their products, recent news, and engineering blog posts',
    'Prepare 3-5 thoughtful questions to ask the interviewer about the team and culture',
    'Practice explaining your projects concisely using the STAR method',
    'Review fundamental data structures and algorithms if a coding round is expected',
    'Have specific examples ready that demonstrate your impact with quantifiable results',
    'Be prepared to discuss trade-offs in your technical decisions',
  ],
  preparation_summary: 'Based on the job description and your resume, focus on demonstrating your experience with scalable backend systems, data pipeline engineering, and cross-functional collaboration. The interviewer will likely probe your system design knowledge and ability to work in fast-paced environments. Prepare concrete examples from your experience that show measurable impact.',
}

// ============================================================
// ERROR BOUNDARY
// ============================================================
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
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================
// HELPERS
// ============================================================
function parseAgentResult(result: any) {
  if (!result?.success) return null
  const rawResult = result?.response?.result
  if (typeof rawResult === 'string') {
    return parseLLMJson(rawResult)
  } else if (rawResult && typeof rawResult === 'object') {
    return rawResult
  }
  return parseLLMJson(rawResult)
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">{part}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

// ============================================================
// COPY BUTTON
// ============================================================
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
      {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ============================================================
// CIRCULAR SCORE
// ============================================================
function CircularScore({ score, size = 140, strokeWidth = 10 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const safeScore = typeof score === 'number' ? Math.min(100, Math.max(0, score)) : 0
  const offset = circumference - (safeScore / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-600'
    if (s >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const getStrokeColor = (s: number) => {
    if (s >= 80) return '#16a34a'
    if (s >= 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(25 20% 88%)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={getStrokeColor(safeScore)} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn('text-3xl font-bold', getColor(safeScore))}>{safeScore}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

// ============================================================
// SCORE BAR
// ============================================================
function ScoreBar({ label, value }: { label: string; value: number }) {
  const safeVal = typeof value === 'number' ? Math.min(100, Math.max(0, value)) : 0
  const getColor = (v: number) => {
    if (v >= 80) return 'bg-green-600'
    if (v >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{safeVal}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted">
        <div className={cn('h-2 rounded-full transition-all duration-700 ease-out', getColor(safeVal))} style={{ width: `${safeVal}%` }} />
      </div>
    </div>
  )
}

// ============================================================
// QUESTION CARD (for Interview Prep)
// ============================================================
function QuestionCard({ q, index }: { q: InterviewQuestion; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/50 transition-colors">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary mt-0.5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{q?.question ?? ''}</p>
          {q?.why_asked && <p className="text-xs text-muted-foreground mt-1">{q.why_asked}</p>}
          {q?.topic_area && <Badge variant="outline" className="mt-1 text-xs">{q.topic_area}</Badge>}
          {q?.scenario_type && <Badge variant="outline" className="mt-1 text-xs">{q.scenario_type}</Badge>}
        </div>
        {open ? <FiChevronUp className="flex-shrink-0 mt-1 text-muted-foreground" size={16} /> : <FiChevronDown className="flex-shrink-0 mt-1 text-muted-foreground" size={16} />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 ml-10 space-y-3">
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Suggested Approach</p>
            <p className="text-sm text-foreground leading-relaxed">{q?.suggested_approach ?? ''}</p>
          </div>
          {Array.isArray(q?.key_points) && q.key_points.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Key Points</p>
              <ul className="space-y-1">
                {q.key_points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <FiArrowRight className="flex-shrink-0 mt-1 text-primary" size={12} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// ATS SCORE TAB
// ============================================================
function ATSScoreTab({ data }: { data: ATSData | null }) {
  if (!data) return <div className="text-center text-muted-foreground py-12 text-sm">No ATS analysis data available.</div>
  const matchingKw = Array.isArray(data?.matching_keywords) ? data.matching_keywords : []
  const missingKw = Array.isArray(data?.missing_keywords) ? data.missing_keywords : []
  const gaps = Array.isArray(data?.skill_gaps) ? data.skill_gaps : []
  const strengths = Array.isArray(data?.strengths) ? data.strengths : []

  return (
    <div className="space-y-6">
      {/* Score Header */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <CircularScore score={data?.ats_score ?? 0} />
          <span className="text-sm font-medium text-foreground">ATS Score</span>
        </div>
        <div className="flex-1 w-full space-y-3">
          <ScoreBar label="Keyword Match" value={data?.score_breakdown?.keyword_match ?? 0} />
          <ScoreBar label="Skills Match" value={data?.score_breakdown?.skills_match ?? 0} />
          <ScoreBar label="Experience Relevance" value={data?.score_breakdown?.experience_relevance ?? 0} />
          <ScoreBar label="Education Match" value={data?.score_breakdown?.education_match ?? 0} />
        </div>
      </div>

      {/* Summary */}
      {data?.summary && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-foreground leading-relaxed">{renderMarkdown(data.summary)}</div>
          </CardContent>
        </Card>
      )}

      {/* Keywords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matchingKw.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiCheck className="text-green-600" size={16} />
                Matching Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {matchingKw.map((kw, i) => (
                  <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">{kw}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {missingKw.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiAlertCircle className="text-red-500" size={16} />
                Missing Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {missingKw.map((kw, i) => (
                  <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">{kw}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gaps and Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gaps.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiTarget className="text-amber-500" size={16} />
                Skill Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {gaps.map((g, i) => (
                  <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{g}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {strengths.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <FiCheck className="flex-shrink-0 mt-0.5 text-green-600" size={14} />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ============================================================
// RESUME OPTIMIZER TAB
// ============================================================
function ResumeOptimizerTab({ data }: { data: OptimizerData | null }) {
  if (!data) return <div className="text-center text-muted-foreground py-12 text-sm">No optimization data available.</div>
  const bullets = Array.isArray(data?.optimized_bullets) ? data.optimized_bullets : []
  const suggestedSkills = Array.isArray(data?.suggested_skills) ? data.suggested_skills : []
  const tips = Array.isArray(data?.improvement_tips) ? data.improvement_tips : []

  return (
    <div className="space-y-6">
      {/* Optimized Summary */}
      {data?.optimized_summary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiEdit3 className="text-primary" size={16} />
                Optimized Professional Summary
              </CardTitle>
              <CopyButton text={data.optimized_summary} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">{data.optimized_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Before/After Bullets */}
      {bullets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FiArrowRight size={14} />
            Before / After Comparisons
          </h3>
          {bullets.map((b, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Original</p>
                    <p className="text-sm text-muted-foreground bg-red-50 rounded-md p-3 border border-red-100">{b?.original ?? ''}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Optimized</p>
                    <p className="text-sm text-foreground bg-green-50 rounded-md p-3 border border-green-100">{b?.optimized ?? ''}</p>
                  </div>
                </div>
                {b?.improvement_note && (
                  <div className="flex items-start gap-2 bg-secondary/50 rounded-md p-3">
                    <FiAlertCircle className="flex-shrink-0 mt-0.5 text-primary" size={14} />
                    <p className="text-xs text-muted-foreground">{b.improvement_note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Suggested Skills */}
      {suggestedSkills.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Suggested Skills to Add</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestedSkills.map((s, i) => (
                <Badge key={i} className="bg-primary text-primary-foreground">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvement Tips */}
      {tips.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Improvement Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Overall Assessment */}
      {data?.overall_assessment && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Overall Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-foreground leading-relaxed">{renderMarkdown(data.overall_assessment)}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// OUTREACH TAB
// ============================================================
function OutreachTab({ data }: { data: OutreachData | null }) {
  if (!data) return <div className="text-center text-muted-foreground py-12 text-sm">No outreach data available.</div>
  const subjects = Array.isArray(data?.email_subject_lines) ? data.email_subject_lines : []

  return (
    <div className="space-y-6">
      {/* Cover Letter */}
      {data?.cover_letter && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiMail className="text-primary" size={16} />
                Cover Letter
              </CardTitle>
              <CopyButton text={data.cover_letter} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-secondary/30 rounded-lg p-4 border border-border text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">{data.cover_letter}</div>
          </CardContent>
        </Card>
      )}

      {/* LinkedIn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.linkedin_connection_note && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">LinkedIn Connection Note</CardTitle>
                <CopyButton text={data.linkedin_connection_note} />
              </div>
              <CardDescription>Send when connecting with someone at the company</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/30 rounded-lg p-3 border border-border text-sm text-foreground leading-relaxed">{data.linkedin_connection_note}</div>
            </CardContent>
          </Card>
        )}
        {data?.linkedin_message && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">LinkedIn Follow-Up Message</CardTitle>
                <CopyButton text={data.linkedin_message} />
              </div>
              <CardDescription>Send after your connection request is accepted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/30 rounded-lg p-3 border border-border text-sm text-foreground leading-relaxed">{data.linkedin_message}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Email Subject Lines */}
      {subjects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Email Subject Line Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subjects.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-secondary/30 rounded-md p-3 border border-border">
                  <span className="text-sm text-foreground">{s}</span>
                  <CopyButton text={s} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tone Notes */}
      {data?.tone_notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Tone Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.tone_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// INTERVIEW PREP TAB
// ============================================================
function InterviewPrepTab({ data }: { data: InterviewData | null }) {
  if (!data) return <div className="text-center text-muted-foreground py-12 text-sm">No interview preparation data available.</div>
  const behavioral = Array.isArray(data?.behavioral_questions) ? data.behavioral_questions : []
  const technical = Array.isArray(data?.technical_questions) ? data.technical_questions : []
  const situational = Array.isArray(data?.situational_questions) ? data.situational_questions : []
  const tips = Array.isArray(data?.general_tips) ? data.general_tips : []

  return (
    <div className="space-y-6">
      {/* Preparation Summary */}
      {data?.preparation_summary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-sm text-foreground leading-relaxed">{renderMarkdown(data.preparation_summary)}</div>
          </CardContent>
        </Card>
      )}

      {/* Behavioral */}
      {behavioral.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FiMessageSquare className="text-primary" size={16} />
            Behavioral Questions
            <Badge variant="outline" className="ml-1">{behavioral.length}</Badge>
          </h3>
          <div className="space-y-2">
            {behavioral.map((q, i) => (
              <QuestionCard key={i} q={q} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Technical */}
      {technical.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FiSearch className="text-primary" size={16} />
            Technical Questions
            <Badge variant="outline" className="ml-1">{technical.length}</Badge>
          </h3>
          <div className="space-y-2">
            {technical.map((q, i) => (
              <QuestionCard key={i} q={q} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Situational */}
      {situational.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FiTarget className="text-amber-500" size={16} />
            Situational Questions
            <Badge variant="outline" className="ml-1">{situational.length}</Badge>
          </h3>
          <div className="space-y-2">
            {situational.map((q, i) => (
              <QuestionCard key={i} q={q} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* General Tips */}
      {tips.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">General Interview Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <FiCheck className="flex-shrink-0 mt-0.5 text-green-600" size={14} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function Page() {
  // View state
  const [view, setView] = useState<'input' | 'loading' | 'results'>('input')
  const [showSampleData, setShowSampleData] = useState(false)

  // Input state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Agent states
  const [atsStatus, setAtsStatus] = useState<AgentStatus>({ loading: false, error: null, data: null })
  const [optimizerStatus, setOptimizerStatus] = useState<AgentStatus>({ loading: false, error: null, data: null })
  const [outreachStatus, setOutreachStatus] = useState<AgentStatus>({ loading: false, error: null, data: null })
  const [interviewStatus, setInterviewStatus] = useState<AgentStatus>({ loading: false, error: null, data: null })

  // Active agents
  const [activeAgentIds, setActiveAgentIds] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Computed
  const anyLoading = atsStatus.loading || optimizerStatus.loading || outreachStatus.loading || interviewStatus.loading
  const allDone = view === 'results' || (view === 'loading' && !anyLoading)
  const hasResults = atsStatus.data || optimizerStatus.data || outreachStatus.data || interviewStatus.data

  // Effective data
  const atsData: ATSData | null = showSampleData ? SAMPLE_ATS : (atsStatus.data as ATSData | null)
  const optimizerData: OptimizerData | null = showSampleData ? SAMPLE_OPTIMIZER : (optimizerStatus.data as OptimizerData | null)
  const outreachData: OutreachData | null = showSampleData ? SAMPLE_OUTREACH : (outreachStatus.data as OutreachData | null)
  const interviewData: InterviewData | null = showSampleData ? SAMPLE_INTERVIEW : (interviewStatus.data as InterviewData | null)

  // Determine effective view
  const effectiveView = showSampleData && view === 'input' ? 'results' : (allDone && hasResults && view === 'loading') ? 'results' : view

  // Update view when all agents finish
  useEffect(() => {
    if (view === 'loading' && !anyLoading && hasResults) {
      setView('results')
    }
  }, [view, anyLoading, hasResults])

  // File handling
  const handleFileSelect = useCallback((file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a PDF or DOCX file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be under 10MB.')
      return
    }
    setSelectedFile(file)
    setUploadError(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  // Submit
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile || !jobDescription.trim()) return

    setIsUploading(true)
    setUploadError(null)

    try {
      // Upload file
      const uploadResult = await uploadFiles(selectedFile)
      if (!uploadResult?.success) {
        setUploadError(uploadResult?.error ?? 'Failed to upload resume. Please try again.')
        setIsUploading(false)
        return
      }
      const assetIds = Array.isArray(uploadResult?.asset_ids) ? uploadResult.asset_ids : []
      if (assetIds.length === 0) {
        setUploadError('Upload succeeded but no asset IDs returned. Please try again.')
        setIsUploading(false)
        return
      }

      setIsUploading(false)
      setView('loading')

      // Reset all statuses
      setAtsStatus({ loading: true, error: null, data: null })
      setOptimizerStatus({ loading: true, error: null, data: null })
      setOutreachStatus({ loading: true, error: null, data: null })
      setInterviewStatus({ loading: true, error: null, data: null })
      setActiveAgentIds(Object.values(AGENTS))

      const message = `RESUME:\n[Uploaded as attachment]\n\nJOB DESCRIPTION:\n${jobDescription}`

      // Call all 4 agents in parallel
      const promises = [
        callAIAgent(message, AGENTS.ats, { assets: assetIds }),
        callAIAgent(message, AGENTS.optimizer, { assets: assetIds }),
        callAIAgent(message, AGENTS.outreach, { assets: assetIds }),
        callAIAgent(message, AGENTS.interview, { assets: assetIds }),
      ]

      // Handle each independently
      promises[0].then(result => {
        const parsed = parseAgentResult(result)
        setAtsStatus({ loading: false, error: parsed ? null : (result?.error ?? 'Failed to parse ATS analysis'), data: parsed })
        setActiveAgentIds(prev => prev.filter(id => id !== AGENTS.ats))
      }).catch(err => {
        setAtsStatus({ loading: false, error: err?.message ?? 'ATS analysis failed', data: null })
        setActiveAgentIds(prev => prev.filter(id => id !== AGENTS.ats))
      })

      promises[1].then(result => {
        const parsed = parseAgentResult(result)
        setOptimizerStatus({ loading: false, error: parsed ? null : (result?.error ?? 'Failed to parse optimization'), data: parsed })
        setActiveAgentIds(prev => prev.filter(id => id !== AGENTS.optimizer))
      }).catch(err => {
        setOptimizerStatus({ loading: false, error: err?.message ?? 'Optimization failed', data: null })
        setActiveAgentIds(prev => prev.filter(id => id !== AGENTS.optimizer))
      })

      promises[2].then(result => {
        const parsed = parseAgentResult(result)
        setOutreachStatus({ loading: false, error: parsed ? null : (result?.error ?? 'Failed to parse outreach drafts'), data: parsed })
        setActiveAgentIds(prev => prev.filter(id => id !== AGENTS.outreach))
      }).catch(err => {
        setOutreachStatus({ loading: false, error: err?.message ?? 'Outreach drafting failed', data: null })
        setActiveAgentIds(prev => prev.filter(id => id !== AGENTS.outreach))
      })

      promises[3].then(result => {
        const parsed = parseAgentResult(result)
        setInterviewStatus({ loading: false, error: parsed ? null : (result?.error ?? 'Failed to parse interview prep'), data: parsed })
        setActiveAgentIds(prev => prev.filter(id => id !== AGENTS.interview))
      }).catch(err => {
        setInterviewStatus({ loading: false, error: err?.message ?? 'Interview prep failed', data: null })
        setActiveAgentIds(prev => prev.filter(id => id !== AGENTS.interview))
      })

    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setIsUploading(false)
    }
  }, [selectedFile, jobDescription])

  // Reset
  const handleReset = useCallback(() => {
    setView('input')
    setSelectedFile(null)
    setJobDescription('')
    setAtsStatus({ loading: false, error: null, data: null })
    setOptimizerStatus({ loading: false, error: null, data: null })
    setOutreachStatus({ loading: false, error: null, data: null })
    setInterviewStatus({ loading: false, error: null, data: null })
    setActiveAgentIds([])
    setUploadError(null)
    setShowSampleData(false)
  }, [])

  // Toggle sample data
  const handleToggleSample = useCallback((checked: boolean) => {
    setShowSampleData(checked)
    if (checked && view === 'input') {
      // Show results view with sample
    }
    if (!checked && !hasResults) {
      setView('input')
    }
  }, [view, hasResults])

  const canSubmit = selectedFile && jobDescription.trim().length > 0 && !isUploading

  // Determine default tab
  const getDefaultTab = () => {
    if (showSampleData) return 'ats'
    if (atsStatus.data) return 'ats'
    if (optimizerStatus.data) return 'optimizer'
    if (outreachStatus.data) return 'outreach'
    if (interviewStatus.data) return 'interview'
    return 'ats'
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground font-sans">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <FiTarget className="text-primary-foreground" size={18} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">Job Application Copilot</h1>
                <p className="text-[11px] text-muted-foreground leading-none hidden sm:block">AI-powered resume optimization & interview prep</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
                <Switch id="sample-toggle" checked={showSampleData} onCheckedChange={handleToggleSample} />
              </div>
              {(effectiveView === 'results' || effectiveView === 'loading') && (
                <Button onClick={handleReset} variant="outline" size="sm" className="gap-2 text-xs">
                  <FiRefreshCw size={14} />
                  <span className="hidden sm:inline">New Analysis</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Upload error */}
          {uploadError && (
            <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
              <FiAlertCircle className="flex-shrink-0 mt-0.5 text-destructive" size={16} />
              <div className="flex-1">
                <p className="text-sm text-destructive">{uploadError}</p>
                <button onClick={() => setUploadError(null)} className="text-xs text-destructive/70 mt-1 underline hover:text-destructive">Dismiss</button>
              </div>
            </div>
          )}

          {/* INPUT VIEW */}
          {effectiveView === 'input' && (
            <div className="space-y-8">
              {/* Hero */}
              <div className="text-center space-y-3 py-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Land Your Dream Job</h2>
                <p className="text-muted-foreground text-sm max-w-xl mx-auto">Upload your resume and paste a job description. Four AI agents will analyze your application from every angle -- ATS scoring, resume optimization, outreach drafts, and interview preparation.</p>
              </div>

              {/* Agent Feature Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AGENT_INFO.map((agent) => {
                  const Icon = agent.icon
                  return (
                    <Card key={agent.key} className="text-center">
                      <CardContent className="pt-5 pb-4 px-3 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="text-primary" size={18} />
                        </div>
                        <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground leading-snug">{agent.desc}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Input Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resume Upload */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FiUploadCloud className="text-primary" size={16} />
                      Upload Resume
                    </CardTitle>
                    <CardDescription>PDF or DOCX format, max 10MB</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedFile ? (
                      <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg border border-border">
                        <FiFile className="flex-shrink-0 text-primary" size={24} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => { setSelectedFile(null); setUploadError(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                          <FiX size={16} className="text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          'flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors min-h-[160px]',
                          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                        )}
                      >
                        <FiUploadCloud className="text-muted-foreground" size={32} />
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">Drop your resume here</p>
                          <p className="text-xs text-muted-foreground mt-1">or click to browse files</p>
                        </div>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileInputChange} className="hidden" />
                  </CardContent>
                </Card>

                {/* Job Description */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FiEdit3 className="text-primary" size={16} />
                      Job Description
                    </CardTitle>
                    <CardDescription>Paste the full job posting text</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here... Include the full listing with requirements, qualifications, and responsibilities for best results."
                        rows={8}
                        className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                      />
                      <div className="flex items-center justify-end mt-2">
                        <span className={cn('text-xs', jobDescription.length > 0 ? 'text-muted-foreground' : 'text-muted-foreground/50')}>
                          {jobDescription.length.toLocaleString()} characters
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button onClick={handleAnalyze} disabled={!canSubmit} size="lg" className="gap-2 px-8 text-sm font-semibold">
                  {isUploading ? (
                    <>
                      <FiUploadCloud className="animate-pulse" size={18} />
                      Uploading Resume...
                    </>
                  ) : (
                    <>
                      <FiTarget size={18} />
                      Analyze & Optimize
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* LOADING VIEW */}
          {effectiveView === 'loading' && (
            <div className="space-y-6">
              <div className="text-center space-y-2 py-4">
                <h2 className="text-xl font-bold text-foreground">Analyzing Your Application</h2>
                <p className="text-sm text-muted-foreground">Four AI agents are working in parallel on your resume...</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {AGENT_INFO.map((agent) => {
                  const statusMap: Record<string, AgentStatus> = {
                    ats: atsStatus,
                    optimizer: optimizerStatus,
                    outreach: outreachStatus,
                    interview: interviewStatus,
                  }
                  const status = statusMap[agent.key] ?? { loading: false, error: null, data: null }
                  const Icon = agent.icon
                  return (
                    <Card key={agent.key} className={cn(status.data ? 'border-green-300' : status.error ? 'border-destructive/40' : 'border-border')}>
                      <CardContent className="pt-5 pb-4 flex flex-col items-center gap-3 text-center">
                        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', status.data ? 'bg-green-100' : status.error ? 'bg-destructive/10' : 'bg-primary/10')}>
                          {status.loading ? (
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : status.data ? (
                            <FiCheck className="text-green-600" size={20} />
                          ) : status.error ? (
                            <FiAlertCircle className="text-destructive" size={20} />
                          ) : (
                            <Icon className="text-primary" size={20} />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {status.loading ? 'Processing...' : status.data ? 'Complete' : status.error ? 'Error' : 'Waiting...'}
                        </p>
                        {status.loading && <Skeleton className="h-1.5 w-3/4 rounded-full" />}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              {/* Show early results if some agents have completed */}
              {hasResults && (
                <div className="text-center">
                  <Button variant="outline" size="sm" onClick={() => setView('results')} className="gap-2 text-xs">
                    <FiArrowRight size={14} />
                    View Available Results
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* RESULTS VIEW */}
          {effectiveView === 'results' && (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Analysis Results</h2>
                  <p className="text-sm text-muted-foreground">Your personalized application insights from 4 AI agents</p>
                </div>
                {anyLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Some agents still processing...</span>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <Tabs defaultValue={getDefaultTab()} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                  <TabsTrigger value="ats" className="text-xs sm:text-sm py-2.5 gap-1.5 flex-col sm:flex-row data-[state=active]:shadow-sm">
                    <FiSearch size={14} className="hidden sm:block" />
                    <span>ATS Score</span>
                    {atsStatus.loading && <div className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin" />}
                  </TabsTrigger>
                  <TabsTrigger value="optimizer" className="text-xs sm:text-sm py-2.5 gap-1.5 flex-col sm:flex-row data-[state=active]:shadow-sm">
                    <FiEdit3 size={14} className="hidden sm:block" />
                    <span>Resume</span>
                    {optimizerStatus.loading && <div className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin" />}
                  </TabsTrigger>
                  <TabsTrigger value="outreach" className="text-xs sm:text-sm py-2.5 gap-1.5 flex-col sm:flex-row data-[state=active]:shadow-sm">
                    <FiMail size={14} className="hidden sm:block" />
                    <span>Outreach</span>
                    {outreachStatus.loading && <div className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin" />}
                  </TabsTrigger>
                  <TabsTrigger value="interview" className="text-xs sm:text-sm py-2.5 gap-1.5 flex-col sm:flex-row data-[state=active]:shadow-sm">
                    <FiMessageSquare size={14} className="hidden sm:block" />
                    <span>Interview</span>
                    {interviewStatus.loading && <div className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin" />}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ats" className="mt-6">
                  {atsStatus.loading ? (
                    <LoadingSkeleton label="ATS Analyzer" />
                  ) : atsStatus.error && !atsData ? (
                    <ErrorCard error={atsStatus.error} />
                  ) : (
                    <ATSScoreTab data={atsData} />
                  )}
                </TabsContent>

                <TabsContent value="optimizer" className="mt-6">
                  {optimizerStatus.loading ? (
                    <LoadingSkeleton label="Resume Optimizer" />
                  ) : optimizerStatus.error && !optimizerData ? (
                    <ErrorCard error={optimizerStatus.error} />
                  ) : (
                    <ResumeOptimizerTab data={optimizerData} />
                  )}
                </TabsContent>

                <TabsContent value="outreach" className="mt-6">
                  {outreachStatus.loading ? (
                    <LoadingSkeleton label="Outreach Writer" />
                  ) : outreachStatus.error && !outreachData ? (
                    <ErrorCard error={outreachStatus.error} />
                  ) : (
                    <OutreachTab data={outreachData} />
                  )}
                </TabsContent>

                <TabsContent value="interview" className="mt-6">
                  {interviewStatus.loading ? (
                    <LoadingSkeleton label="Interview Coach" />
                  ) : interviewStatus.error && !interviewData ? (
                    <ErrorCard error={interviewStatus.error} />
                  ) : (
                    <InterviewPrepTab data={interviewData} />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>

        {/* Agent Status Footer */}
        <footer className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">AI Agents</p>
                <Badge variant="outline" className="text-[10px]">{activeAgentIds.length > 0 ? `${activeAgentIds.length} Active` : 'Idle'}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AGENT_INFO.map((agent) => {
                  const isActive = activeAgentIds.includes(agent.id)
                  return (
                    <div key={agent.key} className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', isActive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30')} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{agent.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </footer>
      </div>
    </ErrorBoundary>
  )
}

// ============================================================
// LOADING SKELETON
// ============================================================
function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">{label} is processing your application...</p>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  )
}

// ============================================================
// ERROR CARD
// ============================================================
function ErrorCard({ error }: { error: string }) {
  return (
    <Card className="border-destructive/20">
      <CardContent className="pt-6 flex items-start gap-3">
        <FiAlertCircle className="flex-shrink-0 mt-0.5 text-destructive" size={18} />
        <div>
          <p className="text-sm font-medium text-foreground">Analysis Error</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </CardContent>
    </Card>
  )
}
