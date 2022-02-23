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
import useGetMessage from "utils/useGetMessage"
import Message from "../Message"
import NoMessages from "../Messages/NoMessages"

interface Props {
  searchModel: MessageSearchModel
}

const resolveMessagesApiUrl = (searchModel: MessageSearchModel, lastMessageId?: string): string => {
  const params = convertObjectToURLSearchParams(searchModel)
  if (lastMessageId) {
    params.append("lastMessageId", lastMessageId)
  }
  return combineUrlAndQueryString(`/audit-logging/api/messages`, params.toString())
}

const MessageSearchResults = ({ searchModel }: Props) => {
  const apiUrl = `/audit-logging/api/messages/${searchModel.messageId}`
  const { message, error, isLoading, isError, reload } = useGetMessage(apiUrl)

  return (
    <Fragment>
      <Error message={error?.message} visibleIf={isError} />

      <If condition={!!message && !isError}>
        <Message message={message} reloadMessages={reload} />
      </If>

      <If condition={!message && !isError}>
        <NoMessages />
      </If>

      <Loading isLoading={isLoading} blockScreen={isLoading} />
    </Fragment>
  )
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

const SearchResults = ({ searchModel }: Props) => {
  if (searchModel.messageId) {
    return <MessageSearchResults searchModel={searchModel} />
  } else {
    return <MessagesSearchResults searchModel={searchModel} />
  }
}

export default SearchResults
