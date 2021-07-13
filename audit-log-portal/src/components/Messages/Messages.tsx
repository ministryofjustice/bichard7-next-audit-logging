import { ReactNode } from "react"
import { AuditLog } from "shared"
import Message from "components/Message"
import If from "components/If"

interface Props {
  messages: AuditLog[]
}

const NoMessages = () => (
  <p aria-label="No Messages">
    <i>{`No messages`}</i>
  </p>
)

const MessagesContainer = ({ children }: { children: ReactNode }) => <div aria-label="Messages">{children}</div>

const Messages = ({ messages }: Props) => (
  <>
    <If condition={messages.length === 0}>
      <NoMessages />
    </If>

    <If condition={messages.length > 0}>
      <MessagesContainer>
        <If condition={messages.length > 0}>
          {messages.map((message) => (
            <Message key={message.messageId} message={message} />
          ))}
        </If>
      </MessagesContainer>
    </If>
  </>
)

export default Messages
