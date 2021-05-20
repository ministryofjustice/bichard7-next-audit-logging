import Header from "components/Header"
import Message from "components/Message"
import { ReactNode } from "react"

interface Props {
  messages: {
    messageId: string
    caseId: string
    receivedDate: Date
  }[]
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

    <MessagesContainer>
      {messages.length > 0 && messages.map((message) => <Message key={message.messageId} message={message} />)}
    </MessagesContainer>
  </>
)

export default Messages
