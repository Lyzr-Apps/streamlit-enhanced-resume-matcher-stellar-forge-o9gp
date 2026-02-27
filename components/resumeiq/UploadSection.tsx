'use client'

import { useRef, useCallback, useState } from 'react'
import { FiUploadCloud, FiFileText, FiX } from 'react-icons/fi'
import { Button } from '@/components/ui/button'

interface UploadSectionProps {
  onFileSelected: (file: File) => void
  selectedFile: File | null
  onClearFile: () => void
  onAnalyze: () => void
  isUploading: boolean
}

export default function UploadSection({
  onFileSelected,
  selectedFile,
  onClearFile,
  onAnalyze,
  isUploading,
}: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && file.type === 'application/pdf') {
        onFileSelected(file)
      }
    },
    [onFileSelected]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileSelected(file)
      }
    },
    [onFileSelected]
  )

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2 font-sans">Upload Your Resume</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Upload a PDF resume to get an AI-powered analysis of your skills, experience level, and career category matches.
          </p>
        </div>

        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-all duration-300 backdrop-blur-[8px] bg-card/85 border-white/[0.18] ${isDragging ? 'border-[hsl(142,60%,35%)] bg-[hsl(142,60%,35%)]/5 scale-[1.01]' : 'hover:border-muted-foreground hover:bg-card/95'}`}
          >
            <FiUploadCloud className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-foreground font-medium mb-1">Drop your resume PDF here</p>
            <p className="text-muted-foreground text-sm">or click to browse</p>
            <p className="text-muted-foreground text-xs mt-3">Accepts PDF files only</p>
          </div>
        ) : (
          <div className="rounded-lg backdrop-blur-[8px] bg-card/85 border border-white/[0.18] p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[hsl(142,60%,35%)]/10">
                <FiFileText className="text-[hsl(142,60%,35%)]" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium text-sm truncate">{selectedFile.name}</p>
                <p className="text-muted-foreground text-xs">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClearFile()
                }}
                className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                <FiX size={18} />
              </button>
            </div>

            <Button
              onClick={onAnalyze}
              disabled={isUploading}
              className="w-full mt-6 bg-[hsl(142,60%,35%)] hover:bg-[hsl(142,60%,30%)] text-white font-medium py-3 h-12 text-base transition-all duration-300"
            >
              {isUploading ? 'Uploading...' : 'Analyze Resume'}
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
