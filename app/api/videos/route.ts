import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export const maxDuration = 60 // Set max duration to 60 seconds
export const dynamic = "force-dynamic" // Disable caching

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Video upload API called")

    // Parse the form data
    const formData = await request.formData()
    console.log("Form data parsed")

    const file = formData.get("video") as File | null
    const result = formData.get("result") as string | null

    // Validate inputs
    if (!file) {
      console.error("No video file provided")
      return NextResponse.json({ error: "Video file is required" }, { status: 400 })
    }

    if (!result) {
      console.error("No result provided")
      return NextResponse.json({ error: "Result is required" }, { status: 400 })
    }

    console.log(`Received video: ${file.name}, size: ${file.size}, type: ${file.type}`)
    console.log(`Result: ${result}`)

    // Check file size (limit to 100MB)
    if (file.size > 100 * 1024 * 1024) {
      console.error("File too large")
      return NextResponse.json({ error: "Video file is too large (max 100MB)" }, { status: 400 })
    }

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `${timestamp}-${result}.webm`
    console.log(`Generated filename: ${filename}`)

    // Upload to Vercel Blob
    console.log("Starting upload to Vercel Blob")
    const { url } = await put(filename, file, {
      access: "public",
      handleUploadUrl: "/api/videos/upload-handler", // Optional custom handler
    })
    console.log(`Upload successful, URL: ${url}`)

    // Return success response
    return NextResponse.json({
      success: true,
      url,
      result,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
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
