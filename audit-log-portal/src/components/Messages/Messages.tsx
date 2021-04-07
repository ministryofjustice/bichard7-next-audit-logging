import React from "react"
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
        <i>
          {`No messages`}
        </i>
      </p>
    )}

    {messages.length > 0 && messages.map((message, index) => (
      <Message key={index} message={message} />
    ))}
  </>
)

export default Messages
