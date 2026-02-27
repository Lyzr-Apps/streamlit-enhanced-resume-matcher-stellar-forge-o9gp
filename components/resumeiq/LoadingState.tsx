'use client'

import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="relative mx-auto mb-6 w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-[hsl(142,60%,35%)]/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-[hsl(142,60%,35%)]/30 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-[hsl(142,60%,35%)] animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2 font-sans">Analyzing your resume...</h3>
          <p className="text-muted-foreground text-sm">
            Our AI is reviewing your skills, experience, and qualifications across multiple career categories.
          </p>
        </div>

        <div className="space-y-4">
          <div className="backdrop-blur-[8px] bg-card/85 border border-white/[0.18] rounded-lg p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="backdrop-blur-[8px] bg-card/85 border border-white/[0.18] rounded-lg p-4">
                <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3" />
                <Skeleton className="h-4 w-20 mx-auto mb-2" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[5, 6, 7, 8].map((i) => (
              <div key={i} className="backdrop-blur-[8px] bg-card/85 border border-white/[0.18] rounded-lg p-4">
                <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3" />
                <Skeleton className="h-4 w-20 mx-auto mb-2" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
