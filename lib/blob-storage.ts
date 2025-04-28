import { put } from "@vercel/blob"
import type { VideoRecord } from "@/types/video"

// Define folder structure
const RAW_RECORDINGS_FOLDER = "RAW_RECORDINGS"
const AILYZED_VIDEOS_FOLDER = "AILYZED_VIDEOS"

/**
 * Uploads a video to Vercel Blob storage in the RAW_RECORDINGS folder
 */
export async function uploadRawVideo(
  videoBlob: Blob,
  metadata: {
    result: "ace" | "hit" | "miss"
    timestamp: string
    userId?: string
    location?: string
    discType?: string
    throwType?: string
    distance?: number
    windConditions?: string
    notes?: string
  },
): Promise<VideoRecord> {
  try {
    // Generate a unique filename with timestamp and result
    const timestamp = new Date(metadata.timestamp).toISOString().replace(/[:.]/g, "-")
    const uniqueId = crypto.randomUUID().substring(0, 8)
    const filename = `${RAW_RECORDINGS_FOLDER}/${timestamp}-${metadata.result}-${uniqueId}.webm`

    // Upload to Vercel Blob
    const { url } = await put(filename, videoBlob, {
      access: "public",
      contentType: "video/webm",
      // Store metadata as custom headers
      customMetadata: {
        result: metadata.result,
        timestamp: metadata.timestamp,
        userId: metadata.userId || "anonymous",
        location: metadata.location || "unknown",
        discType: metadata.discType || "unknown",
        throwType: metadata.throwType || "unknown",
        distance: metadata.distance?.toString() || "unknown",
        windConditions: metadata.windConditions || "unknown",
        notes: metadata.notes || "",
        aiProcessed: "false",
      },
    })

    // Create and return a video record
    return {
      id: uniqueId,
      url,
      result: metadata.result,
      timestamp: metadata.timestamp,
      title: `${metadata.result.charAt(0).toUpperCase() + metadata.result.slice(1)} Throw`,
      metadata: {
        userId: metadata.userId || "anonymous",
        location: metadata.location || "unknown",
        discType: metadata.discType || "unknown",
        throwType: metadata.throwType || "unknown",
        distance: metadata.distance,
        windConditions: metadata.windConditions || "unknown",
        notes: metadata.notes || "",
        aiProcessed: false,
      },
    }
  } catch (error) {
    console.error("Error uploading video to Blob storage:", error)
    throw new Error("Failed to upload video")
  }
}

/**
 * Gets a list of all raw videos from the RAW_RECORDINGS folder
 * This is a placeholder function that would need to be implemented with a database
 * since Vercel Blob doesn't support listing operations directly
 */
export async function listRawVideos(): Promise<string[]> {
  // In a real implementation, you would query your database for video records
  // For now, we'll return an empty array
  return []
}

/**
 * Future function to save an AI-analyzed video
 */
export async function saveAnalyzedVideo(
  videoBlob: Blob,
  originalVideoRecord: VideoRecord,
  aiAnalysisResults: any,
): Promise<VideoRecord> {
  try {
    // Extract the filename from the original URL
    const originalUrl = new URL(originalVideoRecord.url)
    const pathParts = originalUrl.pathname.split("/")
    const originalFilename = pathParts[pathParts.length - 1]

    // Create a new filename with the _AILYZED suffix
    const analyzedFilename = `${AILYZED_VIDEOS_FOLDER}/${originalFilename.replace(".webm", "_AILYZED.webm")}`

    // Upload the analyzed video
    const { url } = await put(analyzedFilename, videoBlob, {
      access: "public",
      contentType: "video/webm",
      customMetadata: {
        originalVideoId: originalVideoRecord.id,
        aiProcessed: "true",
        aiConfidence: aiAnalysisResults.confidence?.toString() || "unknown",
        aiDetectedResult: aiAnalysisResults.detectedResult || "unknown",
        aiProcessingTime: aiAnalysisResults.processingTime?.toString() || "unknown",
      },
    })

    // Return the analyzed video record
    return {
      id: `${originalVideoRecord.id}_analyzed`,
      url,
      result: originalVideoRecord.result,
      timestamp: new Date().toISOString(),
      title: `${originalVideoRecord.title} (AI Analyzed)`,
      metadata: {
        ...originalVideoRecord.metadata,
        aiProcessed: true,
        aiAnalysis: aiAnalysisResults,
      },
    }
  } catch (error) {
    console.error("Error saving analyzed video:", error)
    throw new Error("Failed to save analyzed video")
  }
}
