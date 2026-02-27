'use client'

import { FiAward } from 'react-icons/fi'
import CircularProgress from './CircularProgress'

interface TopMatch {
  category: string
  score: number
  summary: string
}

interface TopMatchBannerProps {
  topMatch: TopMatch | null | undefined
}

export default function TopMatchBanner({ topMatch }: TopMatchBannerProps) {
  if (!topMatch) return null

  const category = topMatch?.category ?? 'Unknown'
  const score = typeof topMatch?.score === 'number' ? topMatch.score : 0
  const summary = topMatch?.summary ?? ''

  return (
    <div className="relative overflow-hidden rounded-lg backdrop-blur-[8px] bg-card/85 border border-white/[0.18] p-6 md:p-8 shadow-lg shadow-[hsl(142,60%,35%)]/5">
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(142,60%,35%)]/5 via-transparent to-[hsl(142,60%,35%)]/3 pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <CircularProgress value={score} size={100} strokeWidth={7} labelClassName="text-xl" />
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <FiAward className="text-[hsl(142,60%,35%)]" size={20} />
            <span className="text-xs font-medium uppercase tracking-wider text-[hsl(142,60%,35%)]">
              Top Match
            </span>
          </div>
          <h3 className="text-2xl font-semibold text-foreground mb-2 font-sans">{category}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  )
}
