import useSWRInfinite from "swr/infinite"
import type { KeyLoader } from "swr/dist/types"
import type { AuditLog } from "shared-types"
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
  loadMore: () => Promise<AuditLog[][]>
  reload: () => Promise<AuditLog[][]>
}

const fetchLimit = 10

export default function useGetMessages(url: KeyLoader<string>): UseGetMessagesResult {
  const { data, error, size, setSize, mutate } = useSWRInfinite(url, (fetchUrl: string) =>
    fetcher<MessagesResult>(fetchUrl).then((result) => result.messages)
  )

  const messages = <AuditLog[]>(data && !error ? [].concat(...data) : [])
  const lastFetchResult = size > 0 && data?.[size - 1]

  const isLoadingInitialData = !data && !error
  const isLoadingData = typeof lastFetchResult === "undefined"
  const isLoadingMore = isLoadingInitialData || isLoadingData

  const islastFetchResultLessThanLimit = lastFetchResult && lastFetchResult.length < fetchLimit
  const isEmpty = messages.length === 0
  const isReachingEnd = isEmpty || islastFetchResultLessThanLimit

  const loadMore = () => setSize(size + 1)

  return { messages, error, loadMore, isLoadingMore, isLoadingInitialData, isReachingEnd, reload: mutate }
}
