import Message from "components/Message"

interface Props {
  messages: {
    messageId: string
    caseId: string
    receivedDate: Date
  }[]
}

const Messages = ({ messages }: Props) => (
  <>
    <h3>Messages</h3>

    {messages.length === 0 && (
      <p>
        <i>{`No messages`}</i>
      </p>
    )}

    {messages.length > 0 && messages.map((message) => <Message key={message.messageId} message={message} />)}
  </>
)

export default Messages
