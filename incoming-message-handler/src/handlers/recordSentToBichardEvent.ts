import { isError, AuditLog } from "shared"
import createSentToBichardEvent from "src/use-cases/createSentToBichardEvent"

export default async function recordSentToBichardEvent(message: AuditLog): Promise<AuditLog> {
  const result = await createSentToBichardEvent(message)

  if (isError(result)) {
    throw result
  }

  return message
}
