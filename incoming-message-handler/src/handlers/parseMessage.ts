import { isError } from "shared"
import { AuditLog, ReceivedMessage } from "src/entities"
import readMessage from "src/use-cases/readMessage"

export default async function parseMessage(event: ReceivedMessage): Promise<AuditLog> {
  const auditLog = await readMessage(event)

  if (isError(auditLog)) {
    throw auditLog
  }

  return auditLog
}
