import useSWR, { useSWRConfig } from "swr"
import type { AuditLog } from "shared-types"
import fetcher from "./fetcher"

interface MessagesResult {
  message: AuditLog
}

interface UseGetMessageResult {
  message: AuditLog
  error: Error
  isLoading: boolean
  reload: () => Promise<AuditLog[]>
}

export default function useGetMessages(url: string): UseGetMessageResult {
  const { data, error } = useSWR(url, (fetchUrl: string) =>
    fetcher<MessagesResult>(fetchUrl).then((result) => result.message)
  )
  const { mutate } = useSWRConfig()

  const isLoading = !error && data === undefined
  const message = <AuditLog>(data && !error ? data : null)

  return { message, error, isLoading, reload: () => mutate(url) }
}
