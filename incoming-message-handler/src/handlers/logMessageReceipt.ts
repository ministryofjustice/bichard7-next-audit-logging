import type { AuditLog } from "shared-types"
import { isError } from "shared-types"
import { getApiKey, getApiUrl } from "src/configs"
import PersistMessageUseCase from "src/use-cases/PersistMessageUseCase"

const persistMessageUseCase = new PersistMessageUseCase(getApiUrl(), getApiKey())

export default async function logMessageReceipt(event: AuditLog): Promise<AuditLog> {
  const persistMessageResult = await persistMessageUseCase.persist(event)

  if (isError(persistMessageResult)) {
    throw persistMessageResult
  }

  return event
}
