import { render } from "testing/render"
import { AuditLog } from "shared"
import StatusIcon from "./StatusIcon"

test.each<string>(["Processing", "Completed", "Error message"])("matches the snapshot when status is %s", (status) => {
  const message = new AuditLog("ExternalCorrelationId", new Date(), "XML")
  message.status = status

  const { container } = render(<StatusIcon message={message} />)

  expect(container).toMatchSnapshot()
})
