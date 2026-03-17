"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info, Loader2, Download, Share2, Edit } from "lucide-react"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import { toast } from "sonner"
import { generateImage } from "./actions"
import { InkMeUpButton } from "@/components/ink-me-up-button/InkMeUpButton"
import { PromptInputBox } from "@/components/ui/ai-prompt-box"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function LabelWithTooltip({ id, label, tooltip }: { id?: string, label: string, tooltip: string }) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-xs text-sm">
          <p>{tooltip}</p>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  
  // Share State
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareFile, setShareFile] = useState<File | null>(null)
  const [shareUrl, setShareUrl] = useState("")

  // Form State
  const [prompt, setPrompt] = useState("")
  const [images, setImages] = useState<string[]>([])

  const handleGenerate = async () => {
    if (isLoading) return // Prevent double clicks
    
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to generate an image")
      return
    }

    setIsLoading(true)
    setGeneratedImages([])

    const formData = new FormData()
    formData.append("prompt", prompt)
    for (const img of images) {
      if (img) formData.append("image", img)
    }

    const result = await generateImage(formData)

    if (result.success && result.output) {
      setGeneratedImages(Array.isArray(result.output) ? (result.output as string[]) : [result.output as string])
    } else {
      console.error(result.error)
      toast.error(result.error || "Failed to generate image. Please try again.")
    }
    setIsLoading(false)
  }

  const handlePromptBoxFilesChange = async (files: File[]) => {
    const file = files?.[0]
    if (!file) {
      setImages([])
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG, GIF)")
      return
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(file)
      })
      setImages([dataUrl])
    } catch {
      toast.error("Failed to read file. Please try again.")
    }
  }

  const handleDownload = async (url: string, index: number) => {
    try {
      const filename = `generated-image-${index + 1}.webp`
      const response = await fetch(`/api/download?url=${encodeURIComponent(url)}&filename=${filename}`)
      if (!response.ok) throw new Error('Network response was not ok')
      
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success("Image downloaded successfully")
    } catch (error) {
      console.error('Download failed:', error)
      toast.error("Download failed. Please try again.")
    }
  }

  const handleShare = async (url: string, index: number) => {
    const filename = `generated-image-${index + 1}.webp`
    setShareUrl(url)
    
      if (navigator.canShare && navigator.canShare({ files: [new File([], 'test.png')] })) {
        toast.info("Preparing image for sharing...")
        
        try {
          const response = await fetch(`/api/download?url=${encodeURIComponent(url)}&filename=${filename}`)
          if (response.ok) {
            const blob = await response.blob()
            const file = new File([blob], filename, { type: blob.type })
            setShareFile(file)
            setShareDialogOpen(true)
            return
          }
        } catch (error) {
          console.warn("File preparation failed", error)
        }
      }

    // Fallback to Link Sharing immediately if file sharing isn't supported or failed
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'TaTTTy AI Generation',
          text: 'Check out this image I generated with GoKAnI AI!',
          url: url
        })
        toast.success("Shared link successfully")
        return
      }
    } catch (error) {
      console.warn("Link sharing failed", error)
    }

    // Fallback to Clipboard
    try {
      await navigator.clipboard.writeText(url)
      toast.info("Sharing failed, link copied to clipboard instead!")
    } catch {
      toast.error("Failed to share. Try downloading instead.")
    }
  }

  const executeShare = async () => {
    if (!shareFile) return
    
    try {
      await navigator.share({
        title: 'GoKAnI AI Generation',
        text: 'Check out this image I generated with GoKAnI AI!',
        files: [shareFile]
      })
      toast.success("Shared image successfully")
      setShareDialogOpen(false)
    } catch (error) {
      console.warn("Share execution failed", error)
      
      // If user cancelled, just close dialog
      if (error instanceof Error && error.name === 'AbortError') {
        setShareDialogOpen(false)
        return
      }

      // Fallback to link sharing
      if (shareUrl) {
        try {
          await navigator.share({
            title: 'GoKAnI AI Generation',
            text: 'Check out this image I generated with GoKAnI AI!',
            url: shareUrl
          })
          setShareDialogOpen(false)
          return
        } catch {
           // ignore
        }
      }
      
      toast.error("Sharing failed. Try downloading instead.")
      setShareDialogOpen(false)
    }
  }

  const slides = generatedImages.map((src) => ({
    src,
    width: 1024,
    height: 1024,
  }))

  return (
    <div className="flex flex-col w-full">
      <div className="container mx-auto pt-2 pb-3 px-4 space-y-6 max-w-6xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <LabelWithTooltip
                  id="prompt"
                  label="Prompt"
                  tooltip="Prompt for generated image."
                />
              </div>
              <PromptInputBox
                placeholder="Enter your prompt here..."
                isLoading={isLoading}
                onValueChange={setPrompt}
                onFilesChange={handlePromptBoxFilesChange}
              />
            </div>

            {/* PromptInputBox includes image upload; keep state in sync via onSend */}
          </div>
      </div>

      <InkMeUpButton onClick={handleGenerate} isLoading={isLoading} />
      
      <div className="flex flex-col items-center pb-4">
        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
            aria-live="polite"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="relative rounded-xl overflow-hidden flex items-center justify-center w-full border border-border/50 aspect-square bg-muted/20">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" aria-hidden="true" />
                    <div className="text-sm text-muted-foreground">Generating…</div>
                  </div>
                </div>
                <div className="flex gap-2 w-full opacity-60">
                  <div className="flex-1 h-9 rounded-lg bg-muted/30 border border-border/50" />
                  <div className="flex-1 h-9 rounded-lg bg-muted/30 border border-border/50" />
                  <div className="flex-1 h-9 rounded-lg bg-muted/30 border border-border/50" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {generatedImages.map((src, i) => (
              <div key={i} className="flex flex-col gap-3 group">
                <div 
                  className="relative rounded-xl overflow-hidden flex items-center justify-center w-full border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer aspect-square bg-muted/20"
                  onClick={() => {
                    setLightboxIndex(i)
                    setLightboxOpen(true)
                  }}
                >
                  <Image
                    src={src}
                    alt={`Generated image ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 h-9 rounded-lg"
                    onClick={() => handleDownload(src, i)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 h-9 rounded-lg"
                    onClick={() => handleShare(src, i)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 h-9 rounded-lg"
                    onClick={() => {
                      if (images.length < 4) {
                        setImages([...images, src])
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                        toast.success("Added to workspace for editing")
                      } else {
                        toast.error("Workspace is full (max 4 images)")
                      }
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
      />

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ready to Share</DialogTitle>
            <DialogDescription>
              Your image has been prepared. Click the button below to share it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button onClick={executeShare}>Share Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}