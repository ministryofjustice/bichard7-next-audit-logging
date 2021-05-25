import { AuditLog } from "shared"
import PageProps from "utils/PageProps"
import config from "config"

interface Props {
  message: AuditLog
}

const MessageView = ({ message }: Props) => <div>{`TODO: Message View + Events: ${message.externalCorrelationId}`}</div>

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
