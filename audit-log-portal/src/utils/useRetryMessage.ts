import type { AuditLog } from "shared"
import useFetch from "use-http"

type UseRetryMessageResult = (message: AuditLog) => Promise<void>

export default (): UseRetryMessageResult => {
  const { post } = useFetch<void>("/api/messages")
  const retryMessage = (message: AuditLog): Promise<void> => post(`/${message.messageId}/retry`)

  return retryMessage
}
