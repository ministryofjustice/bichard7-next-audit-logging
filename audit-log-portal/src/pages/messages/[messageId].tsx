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

  const { data, error } = useSWR(`/api/messages/${messageId}`, fetcher)

  console.log(data)

  return (
    <Layout pageTitle="Events">
      <Header text="Events" />

      {!!error && <Error message={error.message} />}
      {!!data && <Events events={(data.message && data.message.events) || []} />}

      <Loading isLoading={!data} />
    </Layout>
  )
}

export default MessageView
