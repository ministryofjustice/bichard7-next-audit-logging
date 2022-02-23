import type MessageSearchModel from "types/MessageSearchModel"
import useGetMessages from "utils/useGetMessages"
import Messages from "../Messages"
import convertObjectToURLSearchParams from "utils/convertObjectToURLSearchParams"
import combineUrlAndQueryString from "utils/combineUrlAndQueryString"
import InfiniteScroll from "react-infinite-scroll-component"
import If from "../If"
import Loading from "../Loading"
import { Fragment } from "react"
import Error from "components/Error"
import type { Props } from "./SearchResults"

const resolveMessagesApiUrl = (searchModel: MessageSearchModel, lastMessageId?: string): string => {
  // map MessageSearchModel fields to messages endpoint query parameters
  const searchParams = {
    status: searchModel.status ?? "",
    externalCorrelationId: searchModel.searchId ?? ""
  }

  const params = convertObjectToURLSearchParams(searchParams)
  if (lastMessageId) {
    params.append("lastMessageId", lastMessageId)
  }
  return combineUrlAndQueryString(`/audit-logging/api/messages`, params.toString())
}

const MessagesSearchResults = ({ searchModel }: Props) => {
  const { messages, error, loadMore, isLoadingInitialData, isLoadingMore, isReachingEnd, reload } = useGetMessages(
    (_, previousMessages) => {
      //@ts-ignore
      const lastMessageId = previousMessages?.slice(-1)?.[0].messageId
      return resolveMessagesApiUrl(searchModel, lastMessageId)
    }
  )

  return (
    <Fragment>
      <Error message={error?.message} visibleIf={!!error} />

      <If condition={!!messages && !error}>
        <InfiniteScroll next={loadMore} hasMore={!isReachingEnd} dataLength={messages.length} loader>
          <Messages messages={messages || []} reloadMessages={reload} />
        </InfiniteScroll>
      </If>

      <Loading isLoading={isLoadingMore} blockScreen={isLoadingInitialData} />
    </Fragment>
  )
}

export default MessagesSearchResults
