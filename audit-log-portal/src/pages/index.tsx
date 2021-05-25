import { AuditLog } from "shared"
import Messages from "components/Messages"
import Layout from "components/Layout"
import PageProps from "utils/PageProps"
import config from "config"

interface Props {
  data: AuditLog[]
}

const Index = ({ data }: Props) => (
  <Layout pageTitle="Messages">
    <Messages messages={data || []} />
  </Layout>
)

interface ApiResponse extends PageProps<Props> {
  notFound: boolean
}

export async function getServerSideProps(): Promise<ApiResponse> {
  const response = await fetch(`${config.apiUrl}/messages`)
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
