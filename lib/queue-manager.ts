import type { QueueItem, ProcessingQueue, ProcessingStatus } from "@/types/queue"
import type { VideoRecord } from "@/types/video"
import { getVideoRecordById, updateVideoRecord } from "./local-storage"

const QUEUE_STORAGE_KEY = "disc-golf-processing-queue"

// Initialize the queue
export function initQueue(): ProcessingQueue {
  try {
    const storedQueue = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (storedQueue) {
      return JSON.parse(storedQueue)
    }

    // Create a new queue if none exists
    const newQueue: ProcessingQueue = {
      items: [],
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(newQueue))
    return newQueue
  } catch (error) {
    console.error("Error initializing queue:", error)
    return { items: [], lastUpdated: new Date().toISOString() }
  }
}

// Get the current queue
export function getQueue(): ProcessingQueue {
  try {
    const storedQueue = localStorage.getItem(QUEUE_STORAGE_KEY)
    return storedQueue ? JSON.parse(storedQueue) : initQueue()
  } catch (error) {
    console.error("Error getting queue:", error)
    return { items: [], lastUpdated: new Date().toISOString() }
  }
}

// Save the queue
export function saveQueue(queue: ProcessingQueue): void {
  try {
    queue.lastUpdated = new Date().toISOString()
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error("Error saving queue:", error)
  }
}

// Add a video to the queue
export function addToQueue(videoRecord: VideoRecord, priority = 1): QueueItem | null {
  try {
    const queue = getQueue()

    // Check if the video is already in the queue
    const existingItem = queue.items.find((item) => item.videoId === videoRecord.id)
    if (existingItem) {
      return existingItem
    }

    // Create a new queue item
    const newItem: QueueItem = {
      id: crypto.randomUUID(),
      videoId: videoRecord.id,
      status: "pending",
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3,
    }

    // Add to queue and sort by priority (higher numbers first)
    queue.items.push(newItem)
    queue.items.sort((a, b) => b.priority - a.priority)

    // Save the updated queue
    saveQueue(queue)

    return newItem
  } catch (error) {
    console.error("Error adding to queue:", error)
    return null
  }
}

// Get the next item to process
export function getNextPendingItem(): QueueItem | null {
  try {
    const queue = getQueue()

    // Find the first pending item
    return queue.items.find((item) => item.status === "pending" && item.attempts < item.maxAttempts) || null
  } catch (error) {
    console.error("Error getting next pending item:", error)
    return null
  }
}

// Update an item's status
export function updateItemStatus(
  itemId: string,
  status: ProcessingStatus,
  details?: { error?: string },
): QueueItem | null {
  try {
    const queue = getQueue()
    const itemIndex = queue.items.findIndex((item) => item.id === itemId)

    if (itemIndex === -1) {
      return null
    }

    const item = queue.items[itemIndex]
    const now = new Date().toISOString()

    // Update the item
    queue.items[itemIndex] = {
      ...item,
      status,
      updatedAt: now,
      ...(status === "processing" && { processingStartedAt: now }),
      ...(["completed", "failed"].includes(status) && { processingCompletedAt: now }),
      ...(status === "failed" && {
        attempts: item.attempts + 1,
        error: details?.error || "Unknown error",
      }),
    }

    // If the item failed but has more attempts, set it back to pending
    if (status === "failed" && queue.items[itemIndex].attempts < queue.items[itemIndex].maxAttempts) {
      queue.items[itemIndex].status = "pending"
    }

    // Save the updated queue
    saveQueue(queue)

    // Also update the video record with the processing status
    const videoRecord = getVideoRecordById(item.videoId)
    if (videoRecord) {
      const updatedRecord = {
        ...videoRecord,
        metadata: {
          ...videoRecord.metadata,
          processingStatus: status,
          processingUpdatedAt: now,
          ...(details?.error && { processingError: details.error }),
        },
      }
      updateVideoRecord(updatedRecord)
    }

    return queue.items[itemIndex]
  } catch (error) {
    console.error("Error updating item status:", error)
    return null
  }
}

// Remove an item from the queue
export function removeFromQueue(itemId: string): boolean {
  try {
    const queue = getQueue()
    const initialLength = queue.items.length

    queue.items = queue.items.filter((item) => item.id !== itemId)

    if (queue.items.length !== initialLength) {
      saveQueue(queue)
      return true
    }

    return false
  } catch (error) {
    console.error("Error removing from queue:", error)
    return false
  }
}

// Get queue statistics
export function getQueueStats() {
  try {
    const queue = getQueue()

    return {
      total: queue.items.length,
      pending: queue.items.filter((item) => item.status === "pending").length,
      processing: queue.items.filter((item) => item.status === "processing").length,
      completed: queue.items.filter((item) => item.status === "completed").length,
      failed: queue.items.filter((item) => item.status === "failed" && item.attempts >= item.maxAttempts).length,
      lastUpdated: queue.lastUpdated,
    }
  } catch (error) {
    console.error("Error getting queue stats:", error)
    return {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      lastUpdated: new Date().toISOString(),
    }
  }
}

// Clear completed and failed items
export function cleanupQueue(): number {
  try {
    const queue = getQueue()
    const initialLength = queue.items.length

    queue.items = queue.items.filter(
      (item) => !(item.status === "completed" || (item.status === "failed" && item.attempts >= item.maxAttempts)),
    )

    saveQueue(queue)

    return initialLength - queue.items.length
  } catch (error) {
    console.error("Error cleaning up queue:", error)
    return 0
  }
}
