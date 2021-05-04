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
    <h3>{`Messages`}</h3>

    {messages.length === 0 && (
      <p aria-label="No Messages">
        <i>{`No messages`}</i>
      </p>
    )}

    <div aria-label="Messages">
      {messages.length > 0 && messages.map((message) => <Message key={message.messageId} message={message} />)}
    </div>
  </>
)

export default Messages
