"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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
  const [recordingDuration, setRecordingDuration] = useState(0)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Metadata fields
  const [location, setLocation] = useState("")
  const [discType, setDiscType] = useState("")
  const [throwType, setThrowType] = useState("")
  const [distance, setDistance] = useState("")
  const [windConditions, setWindConditions] = useState("")
  const [notes, setNotes] = useState("")
  const [showMetadataForm, setShowMetadataForm] = useState(false)

  useEffect(() => {
    // Start camera automatically when page loads
    startCamera()

    // Clean up function to stop all media tracks when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
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

      // Always use the environment (rear) camera with lower resolution for smaller file size
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 }, // Lower resolution
          height: { ideal: 1280 }, // Lower resolution
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
    setRecordingDuration(0)

    // Use lower bitrate for mobile
    const options = {
      mimeType: "video/webm;codecs=vp8,opus",
      videoBitsPerSecond: 500000, // 500 Kbps - even lower for smaller files
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
      console.log(`Video recorded, size: ${blob.size} bytes, duration: ${recordingDuration}s`)
      setVideoBlob(blob)

      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.src = URL.createObjectURL(blob)
        videoRef.current.controls = true
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }

    // Start recording with smaller chunks for better handling
    mediaRecorder.start(500) // Collect data in 500ms chunks
    mediaRecorderRef.current = mediaRecorder
    setRecording(true)

    // Start a timer to track recording duration
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1)

      // Auto-stop recording after 15 seconds to keep file size small
      if (recordingDuration >= 14) {
        stopRecording()
      }
    }, 1000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      setRecordingComplete(true)

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }

  const handleAttemptComplete = () => {
    stopRecording()
  }

  const handleShotResult = (result: "ace" | "hit" | "miss") => {
    if (!videoBlob) {
      setError("No video recorded")
      return
    }

    setShotResult(result)
    setShowMetadataForm(true)
  }

  const handleUpload = async () => {
    if (!videoBlob || !shotResult) {
      setError("No video recorded or result selected")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      console.log(`Starting upload, video size: ${videoBlob.size} bytes`)

      // Create a FormData object to send the video
      const formData = new FormData()

      // Add video and result
      formData.append("video", videoBlob)
      formData.append("result", shotResult)

      // Add metadata
      if (location) formData.append("location", location)
      if (discType) formData.append("discType", discType)
      if (throwType) formData.append("throwType", throwType)
      if (distance) formData.append("distance", distance)
      if (windConditions) formData.append("windConditions", windConditions)
      if (notes) formData.append("notes", notes)

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
              result: shotResult,
              timestamp: data.timestamp,
              title: `${shotResult.charAt(0).toUpperCase() + shotResult.slice(1)} Throw`,
              metadata: {
                userId: "anonymous",
                location: location || "unknown",
                discType: discType || "unknown",
                throwType: throwType || "unknown",
                distance: distance ? Number(distance) : undefined,
                windConditions: windConditions || "unknown",
                notes: notes || "",
                aiProcessed: false,
              },
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
            {recordingComplete ? (showMetadataForm ? "Add Throw Details" : "Rate Your Shot") : "Recording Throw"}
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
              <div className="absolute top-4 right-4 flex items-center">
                <div className="bg-red-500 rounded-full h-4 w-4 animate-pulse mr-2"></div>
                <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">{recordingDuration}s</span>
              </div>
            )}
          </div>

          {recordingComplete ? (
            showMetadataForm ? (
              <div className="w-full space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium mb-1">
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full p-2 text-sm border rounded"
                      placeholder="Course name"
                    />
                  </div>
                  <div>
                    <label htmlFor="discType" className="block text-sm font-medium mb-1">
                      Disc Type
                    </label>
                    <input
                      id="discType"
                      type="text"
                      value={discType}
                      onChange={(e) => setDiscType(e.target.value)}
                      className="w-full p-2 text-sm border rounded"
                      placeholder="Putter, Driver, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="throwType" className="block text-sm font-medium mb-1">
                      Throw Type
                    </label>
                    <input
                      id="throwType"
                      type="text"
                      value={throwType}
                      onChange={(e) => setThrowType(e.target.value)}
                      className="w-full p-2 text-sm border rounded"
                      placeholder="Backhand, Forehand"
                    />
                  </div>
                  <div>
                    <label htmlFor="distance" className="block text-sm font-medium mb-1">
                      Distance (ft)
                    </label>
                    <input
                      id="distance"
                      type="number"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      className="w-full p-2 text-sm border rounded"
                      placeholder="Distance in feet"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="windConditions" className="block text-sm font-medium mb-1">
                    Wind Conditions
                  </label>
                  <input
                    id="windConditions"
                    type="text"
                    value={windConditions}
                    onChange={(e) => setWindConditions(e.target.value)}
                    className="w-full p-2 text-sm border rounded"
                    placeholder="Calm, Light, Strong, etc."
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-1">
                    Notes
                  </label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 text-sm border rounded"
                    placeholder="Any additional notes about this throw"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => setShowMetadataForm(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={uploading}
                  >
                    Back
                  </Button>
                  <Button onClick={handleUpload} className="flex-1" disabled={uploading}>
                    {uploading ? `Uploading ${uploadProgress}%` : "Save & Upload"}
                  </Button>
                </div>

                {uploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>
            ) : (
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
              </div>
            )
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
