"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Play, RefreshCw } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface VideoForProcessing {
  id: string
  url: string
  result: string
  queueItemId: string
}

export default function AISimulatorPage() {
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<VideoForProcessing | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${message}`])
  }

  const fetchNextVideo = async () => {
    setLoading(true)
    setError(null)

    try {
      addLog("Fetching next video for processing...")
      const response = await fetch("/api/videos/next-for-processing")
      const data = await response.json()

      if (data.success && data.hasVideo) {
        addLog(`Found video: ${data.video.id}`)
        setCurrentVideo({
          id: data.video.id,
          url: data.video.url,
          result: data.video.result,
          queueItemId: data.queueItem.id,
        })
      } else {
        addLog("No videos pending for processing")
        setCurrentVideo(null)
      }
    } catch (err) {
      console.error("Error fetching next video:", err)
      setError(`Error fetching next video: ${err instanceof Error ? err.message : "Unknown error"}`)
      addLog(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const simulateProcessing = async () => {
    if (!currentVideo) {
      setError("No video to process")
      return
    }

    setProcessing(true)
    setError(null)

    try {
      addLog(`Starting AI processing simulation for video ${currentVideo.id}...`)

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 3000))
      addLog("Analyzing video content...")

      // Simulate more processing
      await new Promise((resolve) => setTimeout(resolve, 2000))
      addLog("Detecting throw result...")

      // Generate a random confidence score
      const confidence = Math.floor(Math.random() * 30) + 70 // 70-99%

      // Randomly decide if the AI agrees with the user's rating
      const aiAgrees = Math.random() > 0.3 // 70% chance of agreement
      const detectedResult = aiAgrees
        ? currentVideo.result
        : currentVideo.result === "ace"
          ? "hit"
          : currentVideo.result === "hit"
            ? Math.random() > 0.5
              ? "ace"
              : "miss"
            : "hit"

      addLog(`AI detected result: ${detectedResult.toUpperCase()} (User rated: ${currentVideo.result.toUpperCase()})`)
      addLog(`Confidence score: ${confidence}%`)

      // Simulate creating an analyzed video
      await new Promise((resolve) => setTimeout(resolve, 2000))
      addLog("Generating flight path visualization...")

      // Create a fake analyzed video URL by adding _AILYZED to the original
      const originalUrl = new URL(currentVideo.url)
      const pathParts = originalUrl.pathname.split(".")
      const analyzedVideoUrl = `${originalUrl.origin}${pathParts[0]}_AILYZED.${pathParts[1]}`

      addLog("Analyzed video created")

      // Send the results back to the API
      addLog("Sending results to API...")
      const response = await fetch("/api/videos/ai-processed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: currentVideo.id,
          queueItemId: currentVideo.queueItemId,
          success: true,
          analyzedVideoUrl,
          confidence,
          detectedResult,
          flightPath: {
            points: [
              { x: 0.1, y: 0.5 },
              { x: 0.3, y: 0.4 },
              { x: 0.5, y: 0.3 },
              { x: 0.7, y: 0.4 },
              { x: 0.9, y: 0.5 },
            ],
            color: "#ff0000",
          },
          processingTime: 7.2,
        }),
      })

      const data = await response.json()

      if (data.success) {
        addLog("Processing complete! Results saved.")
      } else {
        throw new Error(data.error || "Failed to save results")
      }

      // Clear the current video
      setCurrentVideo(null)
    } catch (err) {
      console.error("Error in AI simulation:", err)
      setError(`Error in AI simulation: ${err instanceof Error ? err.message : "Unknown error"}`)
      addLog(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)

      // Try to notify the API of the failure
      if (currentVideo) {
        try {
          await fetch("/api/videos/ai-processed", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              videoId: currentVideo.id,
              queueItemId: currentVideo.queueItemId,
              success: false,
              error: err instanceof Error ? err.message : "Unknown error",
            }),
          })
          addLog("Failure notification sent to API")
        } catch (notifyErr) {
          addLog("Failed to send failure notification to API")
        }
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <main className="min-h-screen p-4 bg-[#55277F]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/queue">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Queue
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-white">AI Processing Simulator</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Video for Processing</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2">Fetching next video...</p>
                </div>
              ) : currentVideo ? (
                <div>
                  <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-4">
                    <video src={currentVideo.url} className="w-full h-full object-cover" controls />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <strong>Video ID:</strong> {currentVideo.id}
                    </p>
                    <p>
                      <strong>Queue Item ID:</strong> {currentVideo.queueItemId}
                    </p>
                    <p>
                      <strong>User Result:</strong> {currentVideo.result.toUpperCase()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No videos pending for processing.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={fetchNextVideo} disabled={loading || processing}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Fetch Next
              </Button>
              <Button onClick={simulateProcessing} disabled={!currentVideo || loading || processing}>
                <Play className="h-4 w-4 mr-2" />
                {processing ? "Processing..." : "Process Video"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
              )}
              <Textarea value={logs.join("\n")} readOnly className="font-mono text-xs h-[300px]" />
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setLogs([])} className="w-full">
                Clear Logs
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  )
}
