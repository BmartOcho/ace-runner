import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export const maxDuration = 60 // Fixed: Set to maximum allowed value (60 seconds)
export const dynamic = "force-dynamic"

// Increase the body size limit to 50MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
}

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

    console.log(`Received video: ${file.name || "unnamed"}, size: ${file.size}, type: ${file.type}`)
    console.log(`Result: ${result}`)

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `${timestamp}-${result}.webm`
    console.log(`Generated filename: ${filename}`)

    // Upload to Vercel Blob with a smaller chunk size
    console.log("Starting upload to Vercel Blob")
    const { url } = await put(filename, file, {
      access: "public",
      addRandomSuffix: true, // Add random suffix to avoid name collisions
      contentType: file.type || "video/webm",
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
