import type { VideoRecord } from "@/types/video"

const VIDEOS_STORAGE_KEY = "disc-golf-videos"

export function saveVideoRecord(videoRecord: VideoRecord): void {
  try {
    const existingVideos = getVideoRecords()
    existingVideos.push(videoRecord)
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(existingVideos))
  } catch (error) {
    console.error("Error saving video record to local storage:", error)
  }
}

export function getVideoRecords(): VideoRecord[] {
  try {
    const videos = localStorage.getItem(VIDEOS_STORAGE_KEY)
    return videos ? JSON.parse(videos) : []
  } catch (error) {
    console.error("Error getting video records from local storage:", error)
    return []
  }
}
