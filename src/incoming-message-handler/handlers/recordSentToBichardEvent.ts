import type { AuditLog, SendToBichardOutput } from "src/shared/types"
import { isError } from "src/shared/types"
import { getApiKey, getApiUrl } from "../configs"
import CreateSentToBichardEventUseCase from "../use-cases/CreateSentToBichardEventUseCase"

const createSentToBichardEventUseCase = new CreateSentToBichardEventUseCase(getApiUrl(), getApiKey())

export default async function recordSentToBichardEvent(event: SendToBichardOutput): Promise<AuditLog> {
  const result = await createSentToBichardEventUseCase.create(event)

  if (isError(result)) {
    throw result
  }

  return event.auditLog
}
