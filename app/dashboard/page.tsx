"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { VideoPlayer } from "../components/video-player"
import { getVideoRecords } from "@/lib/local-storage"
import type { VideoRecord } from "@/types/video"

export default function DashboardPage() {
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<VideoRecord | null>(null)
  const [videos, setVideos] = useState<VideoRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load videos from local storage
    const storedVideos = getVideoRecords()
    setVideos(storedVideos)
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

  return (
    <main className="min-h-screen p-4 bg-[#55277F]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Your Videos</h1>
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
                      <h3 className="font-medium">{video.title || "Recorded Throw"}</h3>
                      <p className="text-sm text-gray-500">Date: {formatDate(video.timestamp)}</p>
                      <p className={`text-sm ${getResultClass(video.result)}`}>Result: {video.result.toUpperCase()}</p>
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
