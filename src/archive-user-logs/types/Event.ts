export default interface Event {
  messageType: string
  owner: string
  logGroup: string
  logStream: string
  subscriptionFilters: string[]
  logEvents: LogEvent[]
}

interface LogEvent {
  id: string
  timestamp: number
  message: string
}
