"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { saveVideoRecord } from "@/lib/local-storage"
import type { VideoRecord } from "@/types/video"

export default function RecordPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [recording, setRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [recordingComplete, setRecordingComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const chunksRef = useRef<BlobPart[]>([])
  const [shotResult, setShotResult] = useState<"ace" | "hit" | "miss" | null>(null)

  useEffect(() => {
    // Start camera automatically when page loads
    startCamera()

    // Clean up function to stop all media tracks when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      setError(null)

      // Stop any existing tracks first
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }

      // Always use the environment (rear) camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Start recording automatically
        startRecording(stream)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Could not access camera. Please ensure you have granted permission.")
    }
  }

  const startRecording = (stream: MediaStream) => {
    chunksRef.current = []

    // Use lower bitrate for mobile
    const options = {
      mimeType: "video/webm;codecs=vp8,opus",
      videoBitsPerSecond: 1000000, // 1 Mbps
    }

    // Check if the browser supports the specified mimeType
    let mediaRecorder
    try {
      mediaRecorder = new MediaRecorder(stream, options)
    } catch (e) {
      console.warn("MediaRecorder with options not supported, using default settings", e)
      mediaRecorder = new MediaRecorder(stream)
    }

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      console.log(`Video recorded, size: ${blob.size} bytes`)
      setVideoBlob(blob)

      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.src = URL.createObjectURL(blob)
        videoRef.current.controls = true
      }
    }

    mediaRecorder.start(1000) // Collect data in 1-second chunks
    mediaRecorderRef.current = mediaRecorder
    setRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      setRecordingComplete(true)
    }
  }

  const handleAttemptComplete = () => {
    stopRecording()
  }

  const handleShotResult = async (result: "ace" | "hit" | "miss") => {
    if (!videoBlob) {
      setError("No video recorded")
      return
    }

    setShotResult(result)
    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      console.log(`Starting upload, video size: ${videoBlob.size} bytes`)

      // Create a smaller video blob if the original is too large
      const uploadBlob = videoBlob
      if (videoBlob.size > 50 * 1024 * 1024) {
        // If larger than 50MB
        console.log("Video is large, using smaller chunks")
        // Just use the original for now, but in a real app you might want to compress it
      }

      // Create a FormData object to send the video
      const formData = new FormData()
      formData.append("video", uploadBlob)
      formData.append("result", result)

      console.log("FormData created, sending to API")

      // Upload the video to the API with progress tracking
      const xhr = new XMLHttpRequest()

      xhr.open("POST", "/api/videos", true)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          console.log(`Upload progress: ${progress}%`)
          setUploadProgress(progress)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log("Upload successful")
          try {
            const data = JSON.parse(xhr.responseText)

            // Save the video record to local storage
            const videoRecord: VideoRecord = {
              id: data.id,
              url: data.url,
              result: result,
              timestamp: data.timestamp,
              title: `${result.charAt(0).toUpperCase() + result.slice(1)} Throw`,
            }

            saveVideoRecord(videoRecord)

            // Navigate to the dashboard after a short delay
            setTimeout(() => {
              router.push("/dashboard")
            }, 1500)
          } catch (parseError) {
            console.error("Error parsing response:", parseError)
            setError("Error processing server response")
          }
        } else {
          console.error("Upload failed with status:", xhr.status)
          console.error("Response:", xhr.responseText)
          setError(`Upload failed: ${xhr.status} ${xhr.statusText}`)
        }
        setUploading(false)
      }

      xhr.onerror = () => {
        console.error("Network error during upload")
        setError("Network error. Please check your connection and try again.")
        setUploading(false)
      }

      xhr.onabort = () => {
        console.error("Upload aborted")
        setError("Upload was aborted. Please try again.")
        setUploading(false)
      }

      xhr.send(formData)
    } catch (err) {
      console.error("Error in upload process:", err)
      setError(`Upload error: ${err instanceof Error ? err.message : "Unknown error"}`)
      setUploading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 pt-2 bg-[#55277F]">
      <Card className="w-full max-w-md flex flex-col h-auto">
        <CardHeader className="py-3">
          <CardTitle className="text-center text-lg">
            {recordingComplete ? "Rate Your Shot" : "Recording Throw"}
          </CardTitle>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </CardHeader>
        <CardContent className="flex flex-col items-center p-3 gap-3">
          <div className="relative w-full h-[50vh] bg-black rounded-md overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={recording}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {recording && (
              <div className="absolute top-4 right-4">
                <div className="bg-red-500 rounded-full h-4 w-4 animate-pulse"></div>
              </div>
            )}
          </div>

          {recordingComplete ? (
            <div className="w-full space-y-3 mt-2">
              <h3 className="font-medium text-center text-sm">Rate Your Shot</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleShotResult("ace")}
                  disabled={uploading}
                  className={`py-2 h-auto ${
                    shotResult === "ace"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Ace
                </Button>
                <Button
                  onClick={() => handleShotResult("hit")}
                  disabled={uploading}
                  className={`py-2 h-auto ${
                    shotResult === "hit"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Hit
                </Button>
                <Button
                  onClick={() => handleShotResult("miss")}
                  disabled={uploading}
                  className={`py-2 h-auto ${
                    shotResult === "miss"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Miss
                </Button>
              </div>

              {uploading && (
                <div className="text-center mt-2 space-y-1">
                  <div className="text-blue-600 font-medium text-sm">Uploading video... {uploadProgress}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {shotResult && !uploading && (
                <div className="text-center mt-2 text-green-600 font-medium text-sm">
                  Shot recorded as: {shotResult.toUpperCase()}
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={handleAttemptComplete}
              className="w-full py-3 h-auto text-base mt-2"
              variant={recording ? "default" : "outline"}
              disabled={!recording}
            >
              Attempt Complete
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
