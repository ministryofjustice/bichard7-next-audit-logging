import { useState } from "react"
import Error from "components/Error"
import Header from "components/Header"
import Layout from "components/Layout"
import Loading from "components/Loading"
import Messages from "components/Messages"
import MessageSearch from "components/MessageSearch"
import type MessageSearchModel from "types/MessageSearchModel"
import convertObjectToURLSearchParams from "utils/convertObjectToURLSearchParams"
import combineUrlAndQueryString from "utils/combineUrlAndQueryString"
import InfiniteScroll from "react-infinite-scroll-component"
import useGetMessages from "utils/useGetMessages"
import useGetMessage from "utils/useGetMessageById"
import If from "components/If"
import Message from "components/Message"

const resolveApiUrl = (searchModel: MessageSearchModel, lastMessageId?: string): string => {
  const params = convertObjectToURLSearchParams(searchModel)
  if (lastMessageId) {
    params.append("lastMessageId", lastMessageId)
  }
  return combineUrlAndQueryString(`/audit-logging/api/messages`, params.toString())
}

const Index = () => {
  const [searchModel, setSearchModel] = useState<MessageSearchModel>({})

  if (!!searchModel.internalMessageId) {
    const { message, error, reload } = useGetMessage(
      "/audit-logging/api/messages/".concat(searchModel.internalMessageId)
    )

    return (
      <Layout pageTitle="Messages">
        <Header text="Messages" />
        <MessageSearch onSearch={(model) => setSearchModel(model)} disabled={!message && !error} />

        <Error message={error?.message} visibleIf={!!error} />

        <If condition={!!message && !error}>
          <Message message={message} reloadMessages={() => {}} />
        </If>
      </Layout>
    )
  }

  const { messages, error, loadMore, isLoadingInitialData, isLoadingMore, isReachingEnd, reload } = useGetMessages(
    (_, previousMessages) => {
      //@ts-ignore
      const lastMessageId = previousMessages?.slice(-1)?.[0].messageId
      return resolveApiUrl(searchModel, lastMessageId)
    }
  )

  return (
    <Layout pageTitle="Messages">
      <Header text="Messages" />
      <MessageSearch onSearch={(model) => setSearchModel(model)} disabled={!messages && !error} />

      <Error message={error?.message} visibleIf={!!error} />

      <If condition={!!messages && !error}>
        <InfiniteScroll next={loadMore} hasMore={!isReachingEnd} dataLength={messages.length} loader>
          <Messages messages={messages || []} reloadMessages={reload} />
        </InfiniteScroll>
      </If>

      <Loading isLoading={isLoadingMore} blockScreen={isLoadingInitialData} />
    </Layout>
  )
}

export default Index
