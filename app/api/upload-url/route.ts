import { type NextRequest, NextResponse } from "next/server"
import { getUploadUrl } from "@vercel/blob"

export const maxDuration = 60 // Fixed: Set to maximum allowed value (60 seconds)
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const filename = searchParams.get("filename") || "video.webm"

    // Get a direct upload URL from Vercel Blob
    const { url, blob } = await getUploadUrl({
      callbackUrl: `${request.headers.get("origin")}/api/blob-callback`,
      maxSize: 104857600, // 100MB
      contentType: "video/webm",
      access: "public",
      filename,
    })

    return NextResponse.json({ url, blob })
  } catch (error) {
    console.error("Error generating upload URL:", error)
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 })
  }
}
