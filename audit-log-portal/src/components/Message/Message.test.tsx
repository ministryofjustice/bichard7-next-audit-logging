import { render } from "testing/render"
import { AuditLog } from "shared"
import MockDate from "mockdate"
import Message from "./Message"

test("matches snapshot", () => {
  MockDate.set(new Date("2021-05-24T10:20:30").getTime())

  const message = new AuditLog("ExternalCorrelationId", new Date("2021-05-01T10:25:53"), "XML")

  const { container } = render(<Message message={message} reloadMessages={() => {}} />)

  expect(container).toMatchSnapshot()

  MockDate.reset()
})
