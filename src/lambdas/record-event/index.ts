import { AuditLogEvent, isError } from "shared"
import AuditLogApiGateway from "./AuditLogApiGateway"

interface RecordEventInput {
  messageId: string
  event: AuditLogEvent
  s3Path: string
}

const apiUrl = process.env.API_URL
if (!apiUrl) {
  throw new Error("API_URL environment variable is not set")
}

const api = new AuditLogApiGateway(apiUrl)

export default async (input: RecordEventInput): Promise<void> => {
  const result = await api.createAuditLogEvent(input.messageId, input.event)
  if (isError(result)) {
    throw result
  }
}
