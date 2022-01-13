import type { AuditLog } from "shared-types"
import { isError } from "shared-types"
import type { ReceivedMessage } from "../entities"
import readMessage from "../use-cases/readMessage"

export default async function parseMessage(event: ReceivedMessage): Promise<AuditLog> {
  const auditLog = await readMessage(event)

  if (isError(auditLog)) {
    throw auditLog
  }

  return auditLog
}
