import { type NextRequest, NextResponse } from "next/server"
import { handleUploadComplete } from "@vercel/blob"

export const maxDuration = 60 // Fixed: Set to maximum allowed value (60 seconds)
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const blob = await handleUploadComplete(request)

  // Here you could store the blob URL in a database
  console.log(`Blob uploaded: ${blob.url}`)

  return NextResponse.json(blob)
}
