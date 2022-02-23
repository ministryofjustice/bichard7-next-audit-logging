import useSWR from "swr"
import type { AuditLog } from "shared-types"
import fetcher from "./fetcher"

interface MessagesResult {
  message: AuditLog
}

interface UseGetMessageResult {
  message: AuditLog
  error: Error
  isLoading: boolean
  isError: boolean
  reload: () => Promise<AuditLog>
}

export default function useGetMessages(url: string): UseGetMessageResult {
  const { data, error } = useSWR(url, (fetchUrl: string) =>
    fetcher<MessagesResult>(fetchUrl).then((result) => result.message)
  )

  const isLoading = !error && data === undefined
  const isError = !!error

  const message = <AuditLog>(data && !isError ? data : null)

  // TODO: implement reload()
  return { message, error, isLoading, isError, reload: () => Promise.resolve(null) }
}
