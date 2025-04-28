import { type NextRequest, NextResponse } from "next/server"
import { getVideoRecords } from "@/lib/local-storage"

export const dynamic = "force-dynamic"

// This is a simple API endpoint to list videos for AI access
// In a production environment, you would implement proper authentication
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get all videos from local storage
    const videos = getVideoRecords()

    // Filter for videos that haven't been processed by AI
    const unprocessedVideos = videos.filter((video) => !video.metadata?.aiProcessed)

    // Return the list of unprocessed videos
    return NextResponse.json({
      success: true,
      videos: unprocessedVideos.map((video) => ({
        id: video.id,
        url: video.url,
        result: video.result,
        timestamp: video.timestamp,
        metadata: video.metadata,
      })),
    })
  } catch (error) {
    console.error("Error listing videos:", error)
    return NextResponse.json(
      {
        error: "Failed to list videos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
