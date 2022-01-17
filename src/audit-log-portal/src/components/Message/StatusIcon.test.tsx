import { render } from "testing/render"
import { AuditLog, AuditLogStatus } from "shared-types"
import StatusIcon from "./StatusIcon"

test.each<string>([AuditLogStatus.processing, AuditLogStatus.completed, AuditLogStatus.error])(
  "matches the snapshot when status is %s",
  (status) => {
    const message = new AuditLog("ExternalCorrelationId", new Date(), "XML")
    message.status = status

    const { container } = render(<StatusIcon message={message} />)

    expect(container).toMatchSnapshot()
  }
)