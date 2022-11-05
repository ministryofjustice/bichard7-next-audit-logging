import { z } from "zod"

const ValidLogEvent = z.object({
  id: z.string(),
  timestamp: z.number(),
  message: z.string()
})

const ValidEvent = z.object({
  messageType: z.string(),
  owner: z.string(),
  logGroup: z.string(),
  logStream: z.string(),
  subscriptionFilters: z.string().array(), // string[]
  logEvents: z.array(ValidLogEvent)
})

export default ValidEvent
