import { useState, useEffect } from "react"
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
import useGetMessageById from "utils/useGetMessageById"
import If from "components/If"
import Message from "components/Message"
import type { AuditLog } from "shared-types"

const resolveApiUrl = (searchModel: MessageSearchModel, lastMessageId?: string): string => {
  const params = convertObjectToURLSearchParams(searchModel)
  if (lastMessageId) {
    params.append("lastMessageId", lastMessageId)
  }
  return combineUrlAndQueryString(`/audit-logging/api/messages`, params.toString())
}

const Index = () => {
  const [searchModel, setSearchModel] = useState<MessageSearchModel>({})

  let messages: AuditLog[],
    error: Error,
    loadMore: () => Promise<AuditLog[][]>,
    isLoadingInitialData: boolean,
    isLoadingMore: boolean,
    isReachingEnd: boolean,
    reload: () => Promise<AuditLog[][]>

  messages = []

    useEffect(() => {
      if (!!searchModel.internalMessageId) {
        // let message
        // // eslint-disable-next-line prettier/prettier
        // ({ message, error, reload } = useGetMessageById(
        //   "/audit-logging/api/messages".concat(searchModel.internalMessageId)
        // ))
        // messages = [message]
        messages = []
        error = null
        reload = () => Promise.resolve([[]])
      } else {
        // eslint-disable-next-line prettier/prettier
        ({ messages, error, loadMore, isLoadingInitialData, isLoadingMore, isReachingEnd, reload } = useGetMessages(
          (_, previousMessages) => {
            //@ts-ignore
            const lastMessageId = previousMessages?.slice(-1)?.[0].messageId
            return resolveApiUrl(searchModel, lastMessageId)
          }
        ))
      }
      console.log(messages)
    })

  return (
    <Layout pageTitle="Messages">
      <Header text="Messages" />
      <MessageSearch onSearch={(model) => setSearchModel(model)} disabled={!messages && !error} />

      <Error message={error?.message} visibleIf={!!error} />

      <If condition={messages !== undefined && !error}>
        <If condition={!!searchModel.internalMessageId}>
          <Message message={messages[0]} reloadMessages={reload}></Message>
        </If>
        <If condition={!searchModel.internalMessageId}>
          <InfiniteScroll next={loadMore} hasMore={!isReachingEnd} dataLength={messages.length} loader>
            <Messages messages={messages || []} reloadMessages={reload} />
          </InfiniteScroll>
        </If>
      </If>

      <Loading isLoading={isLoadingMore} blockScreen={isLoadingInitialData} />
    </Layout>
  )
}

export default Index
