import { type NextRequest, NextResponse } from "next/server"
import { uploadRawVideo } from "@/lib/blob-storage"
import { addToQueue } from "@/lib/queue-manager"

export const maxDuration = 60
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Video upload API called")

    // Parse the form data
    const formData = await request.formData()
    console.log("Form data parsed")

    const file = formData.get("video") as File | null
    const result = formData.get("result") as "ace" | "hit" | "miss" | null

    // Optional metadata fields
    const location = formData.get("location") as string | null
    const discType = formData.get("discType") as string | null
    const throwType = formData.get("throwType") as string | null
    const distance = formData.get("distance") ? Number(formData.get("distance")) : undefined
    const windConditions = formData.get("windConditions") as string | null
    const notes = formData.get("notes") as string | null

    // Validate required inputs
    if (!file) {
      console.error("No video file provided")
      return NextResponse.json({ error: "Video file is required" }, { status: 400 })
    }

    if (!result) {
      console.error("No result provided")
      return NextResponse.json({ error: "Result is required" }, { status: 400 })
    }

    console.log(`Received video: ${file.name || "unnamed"}, size: ${file.size}, type: ${file.type}`)
    console.log(`Result: ${result}`)

    // Upload the video with metadata
    const videoRecord = await uploadRawVideo(file, {
      result,
      timestamp: new Date().toISOString(),
      location,
      discType,
      throwType,
      distance,
      windConditions,
      notes,
    })

    // Add the video to the processing queue
    const queueItem = addToQueue(videoRecord)
    console.log("Added to processing queue:", queueItem?.id)

    // Return success response with the video record
    return NextResponse.json({
      success: true,
      ...videoRecord,
      queueItem: queueItem
        ? {
            id: queueItem.id,
            status: queueItem.status,
            position: queueItem.priority,
          }
        : null,
    })
  } catch (error) {
    console.error("Error in video upload API:", error)
    return NextResponse.json(
      {
        error: "Failed to upload video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
