import { render } from "testing/render"
import { AuditLog } from "shared"
import Message from "./Message"

test("matches snapshot", () => {
  const message = new AuditLog("ExternalCorrelationId", new Date("2021-05-01T10:25:53"), "XML")

  const { container } = render(<Message message={message} />)

  expect(container).toMatchSnapshot()
})
