"use server"

import Replicate from "replicate"
import { constructPayload } from "@/lib/payload"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function generateImage(formData: FormData) {
  const prompt = formData.get("prompt") as string
  const image = formData.get("image") as string | null
  const mask = formData.get("mask") as string | null

  // Use the full model identifier
  const modelIdentifier = "tattzy25/tattty_4_all:4e8f6c1dc77db77dabaf98318cde3679375a399b434ae2db0e698804ac84919c"
  
  const input = constructPayload({ 
    prompt, 
    image: image || undefined, 
    mask: mask || undefined 
  })

  try {
    // Using replicate.run as suggested in the issue description for better compatibility
    const output = await replicate.run(modelIdentifier, { input }) as any
    
    if (!output) throw new Error("No output received from Replicate")

    const processOutput = (item: any): string => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object' && typeof item.url === 'function') {
        return item.url().toString()
      }
      if (item && typeof item === 'object' && item.url) {
        return String(item.url)
      }
      return String(item)
    }

    const serializedOutput = Array.isArray(output) 
      ? output.map(processOutput)
      : [processOutput(output)]

    return { success: true, output: serializedOutput }
  } catch (error) {
    console.error("Error generating image:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
