import { isError, AuditLog } from "shared"
import persistMessage from "src/use-cases/persistMessage"

export default async function logMessageReceipt(event: AuditLog): Promise<AuditLog> {
  const persistMessageResult = await persistMessage(event)

  if (isError(persistMessageResult)) {
    throw persistMessageResult
  }

  return event
}
