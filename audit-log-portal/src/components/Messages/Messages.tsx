import React from "react"
import Message from "components/Message"

let number = 1

const messages = [...new Array(10)]
  .map(() => ({
    messageId: `Message-${(number++).toString().padStart(2, "0")}`,
    caseId: number.toString().padEnd(4, "0"),
    receivedDate: new Date()
  }))

const Messages = () => (
  <>
    <h3>Messages</h3>

    {messages.map((message, index) => (
      <Message key={index} message={message} />
    ))}
  </>
)

export default Messages
