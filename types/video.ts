export interface VideoMetadata {
  userId?: string
  location?: string
  discType?: string
  throwType?: string
  distance?: number
  windConditions?: string
  notes?: string
  aiProcessed: boolean
  aiAnalysis?: any
}

export interface VideoRecord {
  id: string
  url: string
  result: "ace" | "hit" | "miss"
  timestamp: string
  title?: string
  metadata?: VideoMetadata
}
