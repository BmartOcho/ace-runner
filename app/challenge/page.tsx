"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function ChallengePage() {
  const router = useRouter()
  const [wagerPlaced, setWagerPlaced] = useState(false)
  const [mounted, setMounted] = useState(false)

  // This ensures the component is fully mounted before any interactivity
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleWagerPlaced = () => {
    console.log("Wager button clicked")
    setWagerPlaced(true)
  }

  const handleStartChallenge = () => {
    router.push("/record")
  }

  // Don't render interactive elements until client-side hydration is complete
  if (!mounted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#55277F]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Attempt Challenge</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="w-full h-16 border rounded-md flex items-center justify-center text-lg">Loading...</div>
            <div className="w-full h-16 border rounded-md flex items-center justify-center text-lg mt-4">
              Loading...
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#55277F]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Attempt Challenge</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <button
            onClick={handleWagerPlaced}
            className={`w-full h-16 text-lg rounded-md flex items-center justify-center ${
              wagerPlaced
                ? "bg-primary text-primary-foreground"
                : "bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
            }`}
            type="button"
          >
            {wagerPlaced ? (
              <span className="flex items-center justify-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Wager Has Been Placed
              </span>
            ) : (
              "Wager Has Been Placed"
            )}
          </button>

          <button
            onClick={handleStartChallenge}
            disabled={!wagerPlaced}
            className={`w-full h-16 text-lg mt-4 rounded-md ${
              !wagerPlaced
                ? "opacity-50 cursor-not-allowed bg-primary text-primary-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
            type="button"
          >
            Start Challenge
          </button>
        </CardContent>
      </Card>
    </main>
  )
}
