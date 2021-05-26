import type { GetServerSideProps } from "next"
import { AuditLog } from "shared"
import Messages from "components/Messages"
import Layout from "components/Layout"
import config from "config"

interface Props {
  data: AuditLog[]
}

const Index = ({ data }: Props) => (
  <Layout pageTitle="Messages">
    <Messages messages={data || []} />
  </Layout>
)

export default Index

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const response = await fetch(`${config.apiUrl}/messages`)
  const data = await response.json()

  if (!data) {
    return {
      notFound: true
    }
  }

  return {
    props: { data }
  }
}
