import { put } from "@vercel/blob"

export async function uploadVideo(videoBlob: Blob, fileName: string): Promise<string> {
  try {
    // Generate a unique file name with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const uniqueFileName = `${timestamp}-${fileName}.webm`

    // Upload to Vercel Blob
    const { url } = await put(uniqueFileName, videoBlob, {
      access: "public",
    })

    return url
  } catch (error) {
    console.error("Error uploading video to Blob storage:", error)
    throw new Error("Failed to upload video")
  }
}
