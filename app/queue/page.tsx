"use client"

import { ArrowLeft, RefreshCw, Trash2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

interface QueueItem {
  id: string
  filename: string
  status: string
  createdAt: string
}

const QueuePage = () => {
  const [queueData, setQueueData] = useState<QueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadQueueData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/get-queue")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setQueueData(data)
    } catch (error) {
      console.error("Failed to load queue data:", error)
      toast.error("Failed to load queue data.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanup = async () => {
    try {
      const response = await fetch("/api/cleanup-queue", {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      toast.success("Queue cleanup initiated.")
      loadQueueData() // Refresh the queue data after cleanup
    } catch (error) {
      console.error("Failed to cleanup queue:", error)
      toast.error("Failed to cleanup queue.")
    }
  }

  useEffect(() => {
    loadQueueData()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-white">Processing Queue</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/ai-simulator">
              <Play className="h-4 w-4 mr-2" />
              AI Simulator
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={loadQueueData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={handleCleanup}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clean Up
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading queue data...</p>
      ) : queueData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Filename
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {queueData.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.filename}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>The processing queue is empty.</p>
      )}
    </div>
  )
}

export default QueuePage
