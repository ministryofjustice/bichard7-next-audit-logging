import MockDate from "mockdate"
import "testing/mockUseFetch"
import { render } from "testing/render"
import AuditLog from "types/AuditLog"
import Message from "./Message"

test("matches snapshot", () => {
  MockDate.set(new Date("2021-05-24T10:20:30").getTime())

  const message = new AuditLog("ExternalCorrelationId", new Date("2021-05-01T10:25:53"), "XML")
  // @ts-ignore
  message.messageId = "test-uuid"

  const { container } = render(<Message message={message} reloadMessages={() => {}} />)

  expect(container).toMatchSnapshot()

  MockDate.reset()
})
