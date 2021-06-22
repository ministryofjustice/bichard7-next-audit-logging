import { useRouter } from "next/dist/client/router"
import useSWR from "swr"
import Error from "components/Error"
import Events from "components/Events"
import Header from "components/Header"
import Layout from "components/Layout"
import Loading from "components/Loading"
import fetcher from "utils/fetcher"

const MessageView = () => {
  const router = useRouter()
  const { messageId } = router.query

  const { data: messageData } = useSWR(`/api/messages/${messageId}`, fetcher)
  const { data: eventsData, error: eventsError } = useSWR(`/api/messages/${messageId}/events`, fetcher)

  return (
    <Layout pageTitle={messageData && messageData.message.externalCorrelationId}>
      <Header text="Events" />

      {!!eventsError && <Error message={eventsError.message} />}
      {!!eventsData && <Events events={(eventsData && eventsData.events) || []} />}

      <Loading isLoading={!eventsData || !messageData} />
    </Layout>
  )
}

export default MessageView
