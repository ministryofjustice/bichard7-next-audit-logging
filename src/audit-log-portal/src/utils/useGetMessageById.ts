import type { AuditLog } from "shared-types";
import fetcher from "./fetcher"

interface MessageResult {
  message: AuditLog
}

interface UseGetMessageResult {
  message: AuditLog
  error: Error
  isError: boolean
  reload: Promise<AuditLog>
}

export default function useGetMessage(url: string): UseGetMessageResult {
  return { message: null, error: Error("no :)"), isError: true, reload: Promise.resolve(null) }
}
