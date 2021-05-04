import { render, screen } from "@testing-library/react"
import Messages from "./Messages"

test("should render 'No Messages' when no messages are given", () => {
  render(<Messages messages={[]} />)

  const noMessages = screen.getByLabelText("No Messages")
  const actualMessages = screen.getByLabelText("Messages")

  expect(noMessages.innerHTML).toContain("No messages")
  expect(actualMessages.children).toHaveLength(0)
})

test("should render 2 messages when 2 messages are given", () => {
  const messages = [
    {
      messageId: "Message1",
      caseId: "123",
      receivedDate: new Date()
    },
    {
      messageId: "Message2",
      caseId: "456",
      receivedDate: new Date()
    }
  ]

  render(<Messages messages={messages} />)

  const noMessages = screen.queryByLabelText("No Messages")
  const actualMessages = screen.getByLabelText("Messages")

  expect(noMessages).toBeNull()
  expect(actualMessages.children).toHaveLength(2)
})
