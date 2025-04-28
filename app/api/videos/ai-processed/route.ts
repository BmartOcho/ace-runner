import { type NextRequest, NextResponse } from "next/server"
import { getVideoRecordById, updateVideoRecord } from "@/lib/local-storage"
import { updateItemStatus } from "@/lib/queue-manager"

export const dynamic = "force-dynamic"

// This is a webhook endpoint for the AI to notify when processing is complete
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body
    const data = await request.json()

    // Validate required fields
    if (!data.videoId || !data.queueItemId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the original video record
    const videoRecord = getVideoRecordById(data.videoId)
    if (!videoRecord) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Update the queue item status
    const updatedItem = updateItemStatus(
      data.queueItemId,
      data.success ? "completed" : "failed",
      data.success ? undefined : { error: data.error || "AI processing failed" },
    )

    if (!updatedItem) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 })
    }

    // If processing was successful, update the video record with AI analysis results
    if (data.success) {
      const updatedRecord = {
        ...videoRecord,
        metadata: {
          ...videoRecord.metadata,
          aiProcessed: true,
          aiAnalysis: {
            analyzedVideoUrl: data.analyzedVideoUrl,
            confidence: data.confidence,
            detectedResult: data.detectedResult,
            flightPath: data.flightPath,
            processingTime: data.processingTime,
            timestamp: new Date().toISOString(),
          },
        },
      }

      // Save the updated record
      const success = updateVideoRecord(updatedRecord)

      if (!success) {
        return NextResponse.json({ error: "Failed to update video record" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Video processing status updated",
      status: updatedItem.status,
    })
  } catch (error) {
    console.error("Error processing AI webhook:", error)
    return NextResponse.json(
      {
        error: "Failed to process AI webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
