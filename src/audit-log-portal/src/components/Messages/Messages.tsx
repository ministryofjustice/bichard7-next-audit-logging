import If from "components/If"
import Message from "components/Message"
import type { ReactNode } from "react"
import type AuditLog from "types/AuditLog"
import NoMessages from "./NoMessages"

interface Props {
  messages: AuditLog[]
  reloadMessages: () => void
}

const MessagesContainer = ({ children }: { children: ReactNode }) => <div aria-label="Messages">{children}</div>

const Messages = ({ messages, reloadMessages }: Props) => (
  <>
    <If condition={messages.length === 0}>
      <NoMessages />
    </If>

    <If condition={messages.length > 0}>
      <MessagesContainer>
        <If condition={messages.length > 0}>
          {messages.map((message) => (
            <Message key={message.messageId} message={message} reloadMessages={reloadMessages} />
          ))}
        </If>
      </MessagesContainer>
    </If>
  </>
)

export default Messages
