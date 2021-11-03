import type { AuditLog } from "shared"
import { isError } from "shared"
import { getApiUrl, getApiKey } from "src/configs"
import CreateSentToBichardEventUseCase from "src/use-cases/CreateSentToBichardEventUseCase"

const createSentToBichardEventUseCase = new CreateSentToBichardEventUseCase(getApiUrl(), getApiKey())

export default async function recordSentToBichardEvent(message: AuditLog): Promise<AuditLog> {
  const result = await createSentToBichardEventUseCase.create(message)

  if (isError(result)) {
    throw result
  }

  return message
}
