'use client'

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
  labelClassName?: string
}

export default function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  className = '',
  showLabel = true,
  labelClassName = '',
}: CircularProgressProps) {
  const safeValue = typeof value === 'number' ? Math.min(100, Math.max(0, value)) : 0
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safeValue / 100) * circumference

  const getColor = (score: number) => {
    if (score >= 75) return 'hsl(142, 60%, 35%)'
    if (score >= 50) return 'hsl(80, 60%, 50%)'
    if (score >= 30) return 'hsl(40, 70%, 50%)'
    return 'hsl(0, 63%, 45%)'
  }

  const color = getColor(safeValue)

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(150, 22%, 15%)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showLabel && (
        <span className={`absolute text-foreground font-semibold ${labelClassName}`}>
          {safeValue}%
        </span>
      )}
    </div>
  )
}
