import { AuditLogApiClient } from "shared"
import type { AuditLogEvent } from "shared-types"
import { isError } from "shared-types"
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

export default async ({ messageId, event }: RecordEventInput): Promise<void> => {
  const result = await useCase.execute(messageId, event)

  if (isError(result)) {
    throw result
  }
}
