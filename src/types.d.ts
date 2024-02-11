export interface icalEvent {
  uid: string
  start: Date
  end: Date
  summary: string
  description: string
  location: string
  backgroundColor?: string
  borderColor?: string
}
