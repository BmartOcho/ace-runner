export interface VideoRecord {
  id: string
  url: string
  result: "ace" | "hit" | "miss"
  timestamp: string
  title?: string
}
