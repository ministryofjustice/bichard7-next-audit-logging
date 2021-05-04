import { render, screen } from "@testing-library/react"
import Message from "./Message"

test("renders all 3 values when given a message", () => {
  const message = {
    messageId: "Message1",
    caseId: "Case1000",
    receivedDate: new Date("2021-05-01T10:25:53")
  }

  render(<Message message={message} />)

  const messageId = screen.getByLabelText("Message Id")
  const caseId = screen.getByLabelText("Case Id")
  const receivedDate = screen.getByLabelText("Received Date")

  expect(messageId.innerHTML).toBe(message.messageId)
  expect(caseId.innerHTML).toBe(message.caseId)
  expect(receivedDate.innerHTML).toContain("01/05/2021 10:25:53")
})
