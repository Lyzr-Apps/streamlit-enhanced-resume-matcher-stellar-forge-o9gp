'use client'

interface SkillBadgeProps {
  label: string
  variant?: 'default' | 'missing' | 'improve' | 'strength'
}

export default function SkillBadge({ label, variant = 'default' }: SkillBadgeProps) {
  const variantClasses: Record<string, string> = {
    default: 'bg-secondary text-secondary-foreground border-border',
    missing: 'bg-red-500/10 text-red-400 border-red-500/20',
    improve: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    strength: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${variantClasses[variant] ?? variantClasses.default}`}>
      {label}
    </span>
  )
}
