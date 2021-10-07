import { AuditLog } from "shared"
import { v4 as uuid } from "uuid"
import format from "xml-formatter"
import replaceMessageIdInXml from "./replaceMessageIdInXml"

const formatXml = (xml: string): string =>
  format(xml, {
    indentation: "  "
  })

const externalCorrelationId = uuid()
const originalXml = formatXml(`
  <?xml version="1.0" encoding="UTF-8"?>
  <RouteData xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <RequestFromSystem>
      <CorrelationID>
        ${externalCorrelationId}
      </CorrelationID>
    </RequestFromSystem>
  </RouteData>
`)

describe("replaceMessageIdInXml()", () => {
  it("should replace the CorrelationID XML element value with the Audit Log Message Id", () => {
    const auditLog = new AuditLog(externalCorrelationId, new Date(), originalXml)

    const transformedXml = replaceMessageIdInXml(auditLog)

    const matchResult = /<CorrelationID>(.*)<\/CorrelationID>/s.exec(transformedXml)
    expect(matchResult).toBeDefined()

    const actualMessageId = matchResult?.[1].trim()
    expect(actualMessageId).toBe(auditLog.messageId)
  })

  it("should not add audit log messageId to the XML when CorrelationID element does not exist", () => {
    const auditLog = new AuditLog(externalCorrelationId, new Date(), "<Xml></Xml>")

    const transformedXml = replaceMessageIdInXml(auditLog)

    const matchResult = /<CorrelationID>(.*)<\/CorrelationID>/s.exec(transformedXml)
    expect(matchResult).toBeNull()
  })
})
