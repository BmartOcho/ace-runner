import { type NextRequest, NextResponse } from "next/server"
import { getNextPendingItem, updateItemStatus } from "@/lib/queue-manager"
import { getVideoRecordById } from "@/lib/local-storage"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the next pending item from the queue
    const nextItem = getNextPendingItem()

    if (!nextItem) {
      return NextResponse.json({
        success: true,
        message: "No videos pending for processing",
        hasVideo: false,
      })
    }

    // Get the video record
    const videoRecord = getVideoRecordById(nextItem.videoId)

    if (!videoRecord) {
      // If the video record doesn't exist, mark the item as failed
      updateItemStatus(nextItem.id, "failed", { error: "Video record not found" })

      return NextResponse.json(
        {
          success: false,
          error: "Video record not found for queue item",
          hasVideo: false,
        },
        { status: 404 },
      )
    }

    // Mark the item as processing
    updateItemStatus(nextItem.id, "processing")

    // Return the video information for processing
    return NextResponse.json({
      success: true,
      hasVideo: true,
      queueItem: {
        id: nextItem.id,
        status: "processing",
        createdAt: nextItem.createdAt,
      },
      video: {
        id: videoRecord.id,
        url: videoRecord.url,
        result: videoRecord.result,
        metadata: videoRecord.metadata,
      },
    })
  } catch (error) {
    console.error("Error getting next video for processing:", error)
    return NextResponse.json(
      {
        error: "Failed to get next video for processing",
        details: error instanceof Error ? error.message : "Unknown error",
        hasVideo: false,
      },
      { status: 500 },
    )
  }
}
