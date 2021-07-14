import type { AuditLog } from "shared"
import { isError } from "shared"
import { getApiUrl } from "src/configs"
import CreateSentToBichardEventUseCase from "src/use-cases/CreateSentToBichardEventUseCase"

const createSentToBichardEventUseCase = new CreateSentToBichardEventUseCase(getApiUrl())

export default async function recordSentToBichardEvent(message: AuditLog): Promise<AuditLog> {
  const result = await createSentToBichardEventUseCase.create(message)

  if (isError(result)) {
    throw result
  }

  return message
}
