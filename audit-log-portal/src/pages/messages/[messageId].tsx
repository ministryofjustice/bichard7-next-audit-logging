import { useRouter } from "next/dist/client/router"
import useSWR from "swr"
import Error from "components/Error"
import Events from "components/Events"
import Header from "components/Header"
import Layout from "components/Layout"
import Loading from "components/Loading"
import IF from "components/If"
import type GetMessageByIdResult from "types/GetMessageByIdResult"
import type GetMessageEventsResult from "types/GetMessageEventsResult"
import fetcher from "utils/fetcher"

const MessageView = () => {
  const router = useRouter()
  const { messageId } = router.query

  const { data: messageData, error: messageError } = useSWR<GetMessageByIdResult>(`/api/messages/${messageId}`, fetcher)
  const { data: eventsData, error: eventsError } = useSWR<GetMessageEventsResult>(
    `/api/messages/${messageId}/events`,
    fetcher
  )

  const getPageTitle = () =>
    messageError || !messageData ? "Message Detail" : messageData.message.externalCorrelationId

  return (
    <Layout pageTitle={getPageTitle()}>
      <Header text="Events" />

      <IF condition={!!eventsError}>
        <Error message={eventsError?.message} />
      </IF>

      <IF condition={!!eventsData}>
        <Events events={eventsData?.events || []} />
      </IF>

      <Loading isLoading={!eventsData || !messageData} />
    </Layout>
  )
}

export default MessageView
