import { AuditLogApiClient } from "@bichard/api-client"
import type { AuditLogEvent } from "shared"
import { isError } from "shared"
import CreateEventUseCase from "./CreateEventUseCase"

export interface RecordEventInput {
  messageId: string
  event: AuditLogEvent
}

const apiUrl = process.env.API_URL
if (!apiUrl) {
  throw new Error("API_URL environment variable is not set")
}

const apiKey = process.env.API_KEY
if (!apiKey) {
  throw new Error("API_KEY environment variable is not set")
}

const api = new AuditLogApiClient(apiUrl, apiKey)
const useCase = new CreateEventUseCase(api)

export default async (input: RecordEventInput): Promise<void> => {
  const result = await useCase.execute(input.messageId, input.event)
  if (isError(result)) {
    throw result
  }
}
