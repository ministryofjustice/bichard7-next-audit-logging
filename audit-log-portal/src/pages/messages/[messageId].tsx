import type { GetServerSideProps } from "next"
import { AuditLog } from "shared"
import Layout from "components/Layout"
import Events from "components/Events"
import config from "config"

interface Props {
  message: AuditLog
}

const MessageView = ({ message }: Props) => (
  <Layout pageTitle="Events">
    <Events events={message.events || []} />
  </Layout>
)

export default MessageView

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const response = await fetch(`${config.apiUrl}/messages/${params.messageId}`)
  const message = (await response.json()) as AuditLog

  return {
    props: {
      message
    }
  }
}
