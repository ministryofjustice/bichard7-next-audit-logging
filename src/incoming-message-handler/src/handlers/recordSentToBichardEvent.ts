import type { AuditLog, SendToBichardOutput } from "shared-types"
import { isError } from "shared-types"
import { getApiUrl, getApiKey } from "../configs"
import CreateSentToBichardEventUseCase from "../use-cases/CreateSentToBichardEventUseCase"

const createSentToBichardEventUseCase = new CreateSentToBichardEventUseCase(getApiUrl(), getApiKey())

export default async function recordSentToBichardEvent(event: SendToBichardOutput): Promise<AuditLog> {
  const result = await createSentToBichardEventUseCase.create(event)

  if (isError(result)) {
    throw result
  }

  return event.auditLog
}
