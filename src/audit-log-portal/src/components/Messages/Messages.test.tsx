import "testing/mockUseFetch"
import { screen } from "@testing-library/react"
import { AuditLog } from "shared-types"
import { render } from "testing/render"
import Messages from "./Messages"

test("should render 'No Messages' when no messages are given", () => {
  render(<Messages messages={[]} reloadMessages={() => {}} />)

  const noMessages = screen.getByLabelText("No Messages")
  const messagesContainer = screen.queryByLabelText("Messages")

  expect(noMessages.innerHTML).toContain("No messages")
  expect(messagesContainer).toBeNull()
})

test("should render 2 messages when 2 messages are given", () => {
  const messages: AuditLog[] = [
    new AuditLog("Message1", new Date(), "XML"),
    new AuditLog("Message2", new Date(), "XML")
  ]

  render(<Messages messages={messages} reloadMessages={() => {}} />)

  expect(screen.queryByLabelText("No Messages")).not.toBeInTheDocument()

  const actualMessages = screen.getByLabelText("Messages")
  expect(actualMessages.children).toHaveLength(2)
})
