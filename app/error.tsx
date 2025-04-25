"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  const handleReset = () => {
    try {
      if (typeof reset === "function") {
        reset()
      } else {
        // Fallback if reset is not a function
        window.location.reload()
      }
    } catch (e) {
      console.error("Error during reset:", e)
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>We're sorry, but there was an error loading this page.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 mb-4">
            <p>Error details: {error.message || "Unknown error"}</p>
            {error.digest && <p className="mt-2">Error ID: {error.digest}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go Home
          </Button>
          <Button onClick={handleReset}>Try Again</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
