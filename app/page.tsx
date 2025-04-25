import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#55277F]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Disc Golf Challenge</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild className="w-full h-16 text-lg">
            <Link href="/challenge">Start Throw</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
