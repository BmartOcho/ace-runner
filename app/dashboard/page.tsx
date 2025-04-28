"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Info, ListOrdered } from "lucide-react"
import { VideoPlayer } from "../components/video-player"
import { getVideoRecords } from "@/lib/local-storage"
import { getQueueStats } from "@/lib/queue-manager"
import type { VideoRecord } from "@/types/video"

export default function DashboardPage() {
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<VideoRecord | null>(null)
  const [videos, setVideos] = useState<VideoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showMetadata, setShowMetadata] = useState<string | null>(null)
  const [queueStats, setQueueStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  })

  useEffect(() => {
    // Load videos from local storage
    const storedVideos = getVideoRecords()
    setVideos(storedVideos)

    // Load queue stats
    const stats = getQueueStats()
    setQueueStats(stats)

    setLoading(false)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getResultClass = (result: string) => {
    switch (result) {
      case "ace":
        return "text-green-600 font-medium"
      case "hit":
        return "text-blue-600 font-medium"
      case "miss":
        return "text-red-600 font-medium"
      default:
        return "text-gray-600"
    }
  }

  const toggleMetadata = (id: string) => {
    if (showMetadata === id) {
      setShowMetadata(null)
    } else {
      setShowMetadata(id)
    }
  }

  return (
    <main className="min-h-screen p-4 bg-[#55277F]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-white">Your Videos</h1>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/queue">
              <ListOrdered className="h-4 w-4 mr-2" />
              Processing Queue
              {queueStats.pending > 0 && (
                <span className="ml-2 bg-yellow-500 text-white rounded-full px-2 py-0.5 text-xs">
                  {queueStats.pending}
                </span>
              )}
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Recorded Throws</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading videos...</div>
            ) : videos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven't recorded any throws yet.</p>
                <Button asChild>
                  <Link href="/">Start a Challenge</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {videos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{video.title || "Recorded Throw"}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMetadata(video.id)}
                          className="p-1 h-auto"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">Date: {formatDate(video.timestamp)}</p>
                      <p className={`text-sm ${getResultClass(video.result)}`}>Result: {video.result.toUpperCase()}</p>

                      {video.metadata?.processingStatus && (
                        <div className="mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              video.metadata.processingStatus === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : video.metadata.processingStatus === "processing"
                                  ? "bg-blue-100 text-blue-800"
                                  : video.metadata.processingStatus === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            AI:{" "}
                            {video.metadata.processingStatus.charAt(0).toUpperCase() +
                              video.metadata.processingStatus.slice(1)}
                          </span>
                        </div>
                      )}

                      {showMetadata === video.id && video.metadata && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs">
                          <p>
                            <strong>Storage Path:</strong> {new URL(video.url).pathname}
                          </p>
                          {video.metadata.location && (
                            <p>
                              <strong>Location:</strong> {video.metadata.location}
                            </p>
                          )}
                          {video.metadata.discType && (
                            <p>
                              <strong>Disc Type:</strong> {video.metadata.discType}
                            </p>
                          )}
                          {video.metadata.throwType && (
                            <p>
                              <strong>Throw Type:</strong> {video.metadata.throwType}
                            </p>
                          )}
                          {video.metadata.distance && (
                            <p>
                              <strong>Distance:</strong> {video.metadata.distance}ft
                            </p>
                          )}
                          {video.metadata.windConditions && (
                            <p>
                              <strong>Wind:</strong> {video.metadata.windConditions}
                            </p>
                          )}
                          {video.metadata.notes && (
                            <p>
                              <strong>Notes:</strong> {video.metadata.notes}
                            </p>
                          )}
                          <p>
                            <strong>AI Processed:</strong> {video.metadata.aiProcessed ? "Yes" : "No"}
                          </p>
                          {video.metadata.aiAnalysis && (
                            <>
                              <p className="mt-1 font-medium">AI Analysis Results:</p>
                              <p>
                                <strong>Detected Result:</strong> {video.metadata.aiAnalysis.detectedResult}
                              </p>
                              <p>
                                <strong>Confidence:</strong> {video.metadata.aiAnalysis.confidence}%
                              </p>
                              {video.metadata.aiAnalysis.analyzedVideoUrl && (
                                <p>
                                  <Button
                                    variant="link"
                                    className="p-0 h-auto text-xs"
                                    onClick={() => {
                                      window.open(video.metadata.aiAnalysis.analyzedVideoUrl, "_blank")
                                    }}
                                  >
                                    View Analyzed Video
                                  </Button>
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="relative aspect-video bg-gray-100">
                      <video
                        src={video.url}
                        className="w-full h-full object-cover"
                        onClick={() => {
                          setCurrentVideo(video)
                          setVideoPlayerOpen(true)
                        }}
                      />
                      <Button
                        className="absolute bottom-4 right-4"
                        onClick={() => {
                          setCurrentVideo(video)
                          setVideoPlayerOpen(true)
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {currentVideo && (
        <VideoPlayer
          url={currentVideo.url}
          title={currentVideo.title || `Video #${currentVideo.id}`}
          open={videoPlayerOpen}
          onOpenChange={setVideoPlayerOpen}
        />
      )}
    </main>
  )
}
