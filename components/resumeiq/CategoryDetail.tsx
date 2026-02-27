'use client'

import { FiAlertTriangle, FiTrendingUp, FiBook, FiTarget } from 'react-icons/fi'
import SkillBadge from './SkillBadge'

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

interface CategoryDetailProps {
  category: CategoryAnalysis | null | undefined
}

export default function CategoryDetail({ category }: CategoryDetailProps) {
  if (!category) return null

  const missingSkills = Array.isArray(category?.missing_skills) ? category.missing_skills : []
  const skillsToImprove = Array.isArray(category?.skills_to_improve) ? category.skills_to_improve : []
  const learningRecs = Array.isArray(category?.learning_recommendations) ? category.learning_recommendations : []
  const experienceLevel = category?.experience_level ?? 'N/A'
  const experienceRationale = category?.experience_rationale ?? ''

  const getLevelColor = (level: string) => {
    const l = (level ?? '').toLowerCase()
    if (l === 'senior' || l === 'expert') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
    if (l === 'mid' || l === 'intermediate') return 'bg-amber-500/15 text-amber-400 border-amber-500/25'
    if (l === 'junior' || l === 'entry') return 'bg-sky-500/15 text-sky-400 border-sky-500/25'
    return 'bg-secondary text-muted-foreground border-border'
  }

  const getTypeBadgeColor = (type: string) => {
    const t = (type ?? '').toLowerCase()
    if (t === 'book') return 'bg-purple-500/15 text-purple-400 border-purple-500/25'
    if (t === 'course' || t === 'online course') return 'bg-blue-500/15 text-blue-400 border-blue-500/25'
    if (t === 'tutorial' || t === 'video') return 'bg-teal-500/15 text-teal-400 border-teal-500/25'
    if (t === 'certification') return 'bg-amber-500/15 text-amber-400 border-amber-500/25'
    return 'bg-secondary text-muted-foreground border-border'
  }

  return (
    <div className="rounded-lg backdrop-blur-[8px] bg-card/85 border border-white/[0.18] p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1 font-sans">
        {category?.name ?? 'Category'} - Detailed Analysis
      </h3>
      <p className="text-muted-foreground text-xs mb-6">In-depth assessment and recommendations</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Missing Skills */}
        <div className="rounded-lg bg-secondary/50 border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiAlertTriangle className="text-red-400" size={16} />
            <h4 className="text-sm font-semibold text-foreground">Missing Skills</h4>
            <span className="ml-auto text-xs text-muted-foreground">{missingSkills.length} skills</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, idx) => (
                <SkillBadge key={idx} label={skill ?? ''} variant="missing" />
              ))
            ) : (
              <p className="text-muted-foreground text-xs">No missing skills identified</p>
            )}
          </div>
        </div>

        {/* Skills to Improve */}
        <div className="rounded-lg bg-secondary/50 border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiTrendingUp className="text-amber-400" size={16} />
            <h4 className="text-sm font-semibold text-foreground">Skills to Improve</h4>
            <span className="ml-auto text-xs text-muted-foreground">{skillsToImprove.length} skills</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {skillsToImprove.length > 0 ? (
              skillsToImprove.map((skill, idx) => (
                <SkillBadge key={idx} label={skill ?? ''} variant="improve" />
              ))
            ) : (
              <p className="text-muted-foreground text-xs">No skills to improve identified</p>
            )}
          </div>
        </div>
      </div>

      {/* Experience Assessment */}
      <div className="rounded-lg bg-secondary/50 border border-border p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <FiTarget className="text-[hsl(142,60%,35%)]" size={16} />
          <h4 className="text-sm font-semibold text-foreground">Experience Assessment</h4>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getLevelColor(experienceLevel)}`}>
            {experienceLevel}
          </span>
        </div>
        {experienceRationale && (
          <p className="text-muted-foreground text-sm leading-relaxed">{experienceRationale}</p>
        )}
      </div>

      {/* Learning Recommendations */}
      <div className="rounded-lg bg-secondary/50 border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiBook className="text-blue-400" size={16} />
          <h4 className="text-sm font-semibold text-foreground">Learning Recommendations</h4>
          <span className="ml-auto text-xs text-muted-foreground">{learningRecs.length} resources</span>
        </div>
        {learningRecs.length > 0 ? (
          <div className="space-y-3">
            {learningRecs.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium">{rec?.skill ?? 'Skill'}</p>
                  <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{rec?.resource ?? ''}</p>
                </div>
                {rec?.type && (
                  <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border ${getTypeBadgeColor(rec.type)}`}>
                    {rec.type}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">No recommendations available</p>
        )}
      </div>
    </div>
  )
}
