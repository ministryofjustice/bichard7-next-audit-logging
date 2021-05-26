import { ReactNode } from "react"
import { AuditLog } from "shared"
import Header from "components/Header"
import Message from "components/Message"

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
    <Header text="Messages" />

    {messages.length === 0 && <NoMessages />}

    {messages.length > 0 && (
      <MessagesContainer>
        {messages.length > 0 && messages.map((message) => <Message key={message.messageId} message={message} />)}
      </MessagesContainer>
    )}
  </>
)

export default Messages
