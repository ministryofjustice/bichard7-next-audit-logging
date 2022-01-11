import type { AuditLog } from "shared-types"
import { isError } from "shared-types"
import { getApiUrl, getApiKey } from "../configs"
import CreateSentToBichardEventUseCase from "../use-cases/CreateSentToBichardEventUseCase"

const createSentToBichardEventUseCase = new CreateSentToBichardEventUseCase(getApiUrl(), getApiKey())

export default async function recordSentToBichardEvent(message: AuditLog): Promise<AuditLog> {
  const result = await createSentToBichardEventUseCase.create(message)

  if (isError(result)) {
    throw result
  }

  return message
}
