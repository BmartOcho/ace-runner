export type ProcessingStatus = "pending" | "processing" | "completed" | "failed"

export interface QueueItem {
  id: string
  videoId: string
  status: ProcessingStatus
  priority: number
  createdAt: string
  updatedAt: string
  processingStartedAt?: string
  processingCompletedAt?: string
  error?: string
  attempts: number
  maxAttempts: number
}

export interface ProcessingQueue {
  items: QueueItem[]
  lastUpdated: string
}
