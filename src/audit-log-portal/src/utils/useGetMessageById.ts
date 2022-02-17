import type { AuditLog } from "shared-types"
import useSWR from "swr"
import fetcher from "./fetcher"

interface UseGetMessageResult {
  message: AuditLog
  error: Error
  reload: () => Promise<AuditLog[][]>
}

interface MessageResult {
  message: AuditLog
}

export default function useGetMessageById(url: string): UseGetMessageResult {
  // const { data, error } = useSWR(url, fetcher)
  return { message: null, error: Error("no :)"), reload: () => Promise.resolve(null) }
}
