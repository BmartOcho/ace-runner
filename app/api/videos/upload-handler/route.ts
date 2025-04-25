import { handleUpload } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // Set max duration to 60 seconds

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const response = await handleUpload({
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in upload handler:", error)
    return NextResponse.json({ error: "Error uploading to Vercel Blob" }, { status: 500 })
  }
}
