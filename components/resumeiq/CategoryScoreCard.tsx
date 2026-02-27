'use client'

import CircularProgress from './CircularProgress'

interface CategoryScoreCardProps {
  name: string
  matchScore: number
  experienceLevel: string
  isSelected: boolean
  onClick: () => void
}

export default function CategoryScoreCard({
  name,
  matchScore,
  experienceLevel,
  isSelected,
  onClick,
}: CategoryScoreCardProps) {
  const safeName = name ?? 'Unknown'
  const safeScore = typeof matchScore === 'number' ? matchScore : 0
  const safeLevel = experienceLevel ?? 'N/A'

  const getLevelColor = (level: string) => {
    const l = (level ?? '').toLowerCase()
    if (l === 'senior' || l === 'expert') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
    if (l === 'mid' || l === 'intermediate') return 'bg-amber-500/15 text-amber-400 border-amber-500/25'
    if (l === 'junior' || l === 'entry') return 'bg-sky-500/15 text-sky-400 border-sky-500/25'
    return 'bg-secondary text-muted-foreground border-border'
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg backdrop-blur-[8px] bg-card/85 border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${isSelected ? 'border-[hsl(142,60%,35%)] shadow-lg shadow-[hsl(142,60%,35%)]/10 bg-card/95' : 'border-white/[0.18] hover:border-white/30'}`}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <CircularProgress value={safeScore} size={64} strokeWidth={5} labelClassName="text-sm" />
        <div>
          <p className="text-foreground font-medium text-sm leading-tight mb-2">{safeName}</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border ${getLevelColor(safeLevel)}`}>
            {safeLevel}
          </span>
        </div>
      </div>
    </button>
  )
}
