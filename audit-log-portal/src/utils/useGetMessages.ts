import { useSWRInfinite } from "swr"
import { KeyLoader } from "swr/dist/types"
import { AuditLog } from "shared"
import fetcher from "./fetcher"

interface MessagesResult {
  messages: AuditLog[]
}

interface UseGetMessagesResult {
  messages: AuditLog[]
  error: Error
  isLoadingInitialData: boolean
  isLoadingMore: boolean
  isReachingEnd: boolean
  size: number
  setSize: (size: number | ((size: number) => number)) => Promise<AuditLog[][]>
}

const fetchLimit = 10

export default function useGetMessages(url: KeyLoader<AuditLog[]>): UseGetMessagesResult {
  const { data, error, size, setSize } = useSWRInfinite(url, (fetchUrl: string) =>
    fetcher<MessagesResult>(fetchUrl).then((result) => result.messages)
  )

  const messages = <AuditLog[]>(data && !error ? [].concat(...data) : [])
  const isLoadingInitialData = !data && !error
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined")
  const isEmpty = data?.[0]?.length === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < fetchLimit)

  return { messages, error, isLoadingMore, size, setSize, isReachingEnd, isLoadingInitialData }
}
