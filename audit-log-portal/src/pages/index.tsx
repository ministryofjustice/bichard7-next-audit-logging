import Messages from "components/Messages"
import Layout from "components/Layout"

interface Props {
  data: []
}

const Index = ({ data }: Props) => (
  <Layout pageTitle="Messages">
    <Messages messages={data || []} />
  </Layout>
)

interface ApiResponse {
  notFound: boolean
  props?: Props
}

export async function getServerSideProps(): Promise<ApiResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages`)
  const data = await response.json()

  if (!data) {
    return {
      notFound: true
    }
  }

  return {
    notFound: false,
    props: { data }
  }
}

export default Index
