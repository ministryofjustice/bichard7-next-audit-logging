import { add, type Duration } from "date-fns"
import type { BichardPostgresGateway } from "src/shared"
import type { DynamoAuditLog, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"

const shouldSanitiseMessage = async (
  postgresGateway: BichardPostgresGateway,
  message: DynamoAuditLog,
  ageThreshold: Duration
): PromiseResult<boolean> => {
  if (add(new Date(message.receivedDate), ageThreshold) > new Date()) {
    return false
  }

  const messageIsInErrorList = await postgresGateway.messageIsInErrorList(message.messageId)
  if (isError(messageIsInErrorList)) {
    return messageIsInErrorList
  }

  if (messageIsInErrorList) {
    return false
  }

  return true
}

export default shouldSanitiseMessage
