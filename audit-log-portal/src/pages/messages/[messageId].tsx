import { AuditLog } from "shared"
import Layout from "components/Layout"
import PageProps from "utils/PageProps"
import config from "config"

interface Props {
  message: AuditLog
}

const MessageView = ({ message }: Props) => (
  <Layout pageTitle="Events">
    {message.events.map((event) => (
      <div key={event.timestamp}>
        {`Event: ${event.category} - ${event.eventType} - ${event.eventSource} (${event.timestamp})`}
      </div>
    ))}
  </Layout>
)

export default MessageView

export async function getServerSideProps({ params }): Promise<PageProps<Props>> {
  const response = await fetch(`${config.apiUrl}/messages/${params.messageId}`)
  const message = (await response.json()) as AuditLog

  return {
    props: {
      message
    }
  }
}
