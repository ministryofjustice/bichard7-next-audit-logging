import { render, screen } from "@testing-library/react"
import Message from "./Message"

test("renders all 3 values when given a message", () => {
  const message = {
    messageId: "Message1",
    caseId: "Case1000",
    receivedDate: new Date("2021-05-01T10:25:53")
  }

  render(<Message message={message} />)

  expect(screen.getByLabelText("Message Id")).toHaveTextContent(message.messageId)
  expect(screen.getByLabelText("Case Id")).toHaveTextContent(message.caseId)
  expect(screen.getByLabelText("Received Date")).toHaveTextContent("01/05/2021 10:25:53")
})
