import type { AuditLog } from "shared-types"
import getXmlElementContent from "../utils/getXmlElementContent"

const unescape = (input: string) =>
  input
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")

const removeProlog = (input: string) => input.replace(/<\?xml[^?]*\?>/g, "")

const transformMessageXml = (auditlog: AuditLog, messageXml: string): string => {
  const organizationalUnitId = getXmlElementContent(messageXml, "OrganizationalUnitID") ?? ""
  const messageType = getXmlElementContent(messageXml, "DataStreamType") ?? ""
  const messageContent = removeProlog(unescape(getXmlElementContent(messageXml, "DataStreamContent") ?? ""))

  const transformedMessage = `<?xml version="1.0" encoding="UTF-8"?>
  <DeliverRequest xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://schemas.cjse.gov.uk/messages/deliver/2006-05 C:ClearCasekel-masri_BR7_0_1_intgBR7XML_ConverterSourceClassGenerationschemasReceiveDeliverServiceDeliverService-v1-0.xsd">
    <msg:MessageIdentifier>${auditlog.messageId}</msg:MessageIdentifier>
    <msg:RequestingSystem>
      <msg:Name>CJSE</msg:Name>
      <msg:OrgUnitCode>Z000000</msg:OrgUnitCode>
      <msg:Environment>Production</msg:Environment>
    </msg:RequestingSystem>
    <msg:AckRequested>1</msg:AckRequested>
    <mm:MessageMetadata SchemaVersion="1.0">
      <mm:OriginatingSystem>
        <msg:Name>BICHARD7</msg:Name>
        <msg:OrgUnitCode>${organizationalUnitId}</msg:OrgUnitCode>
        <msg:Environment>Production</msg:Environment>
      </mm:OriginatingSystem>
      <mm:DataController>
        <msg:Organisation>C765432</msg:Organisation>
        <msg:ReferencedElementURI>http://www.altova.com</msg:ReferencedElementURI>
      </mm:DataController>
      <mm:CreationDateTime>2001-12-17T09:30:47-05:00</mm:CreationDateTime>
      <mm:ExpiryDateTime>2031-12-17T09:30:47-05:00</mm:ExpiryDateTime>
      <mm:SenderRequestedDestination>String</mm:SenderRequestedDestination>
    </mm:MessageMetadata>
    <mf:MessageFormat SchemaVersion="1.0">
      <mf:MessageType>
        <msg:Type>${messageType}</msg:Type>
        <msg:Version>1.200</msg:Version>
      </mf:MessageType>
      <mf:MessageSchema>
        <msg:Namespace>http://www.dca.gov.uk/xmlschemas/libra</msg:Namespace>
        <msg:Version>TBC</msg:Version>
      </mf:MessageSchema>
    </mf:MessageFormat>
    <Message>
${messageContent}
    </Message>
  </DeliverRequest>
  `

  return transformedMessage
}

export default transformMessageXml
