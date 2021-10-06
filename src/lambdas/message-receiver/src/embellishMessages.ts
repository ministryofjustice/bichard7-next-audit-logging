import type { EventMessage, MessageFormat, AmazonMqEventSourceRecordEvent, JmsTextMessage } from "shared"
import { decodeBase64, encodeBase64 } from "shared"

type Result = {
  messages: EventMessage[]
}

const getEventSourceQueueName = (message: JmsTextMessage): string => {
  return message.destination.physicalName.replace(".FAILURE", "")
}

const castToOldMessageVersion = function (transformedXml: string) {
  if (!transformedXml.includes("<RouteData ")) {
    return transformedXml
  }

  let resultXml = decodeBase64(transformedXml)
  resultXml = resultXml.replace(/&lt;/g, "<")
  resultXml = resultXml.replace(/&gt;/g, ">")
  resultXml = resultXml.replace(/(\n|\t)/gm, "")
  resultXml = resultXml.replace("RouteData", "DeliverRequest")

  const organizationalUnitId =
    resultXml.match('<OrganizationalUnitID literalvalue="String">(.*)</OrganizationalUnitID>')?.[1]?.trim() ?? ""
  const messageType = resultXml.match('<DataStreamType literalvalue="String">(.*)</DataStreamType>')?.[1]?.trim() ?? ""
  const correlationId = resultXml.match("<CorrelationID>(.*)</CorrelationID>")?.[1]?.trim() ?? ""
  const messageContent = resultXml.match("<DataStreamContent>(.*)</DataStreamContent>")?.[1]?.trim() ?? ""

  // remove the request from and replace it with old version of xml
  const firstRequestFromSystemSection = resultXml.split(/<RequestFromSystem VersionNumber="1.0">/)[0]
  const thirdRequestFromSystemSection = resultXml.split(/<\/RequestFromSystem>/)[1]
  resultXml = `${firstRequestFromSystemSection}<msg:MessageIdentifier>
    ${correlationId}
  </msg:MessageIdentifier>
	<msg:RequestingSystem>
		<msg:Name>CJSE</msg:Name>
		<msg:OrgUnitCode>${organizationalUnitId}</msg:OrgUnitCode>
		<msg:Environment>Production</msg:Environment>
	</msg:RequestingSystem>
	<msg:AckRequested>1</msg:AckRequested>
	<mm:MessageMetadata SchemaVersion="1.0">
		<mm:OriginatingSystem>
			<msg:Name>BICHARD7</msg:Name>
			<msg:OrgUnitCode>C234567</msg:OrgUnitCode>
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
	</mf:MessageFormat>${thirdRequestFromSystemSection}`

  // add the message content (this should still have the same format as before)
  const firstMessageSection = resultXml.split(/<DataStream VersionNumber="1.0">/)[0]
  const thirdMessageSection = resultXml.split(/<\/DataStream>/)[1]
  resultXml = `${firstMessageSection}<Message>${messageContent}</Message>${thirdMessageSection}`
  ;[resultXml] = resultXml.split(/<Routes VersionNumber="1.0">/) // remove the last portion of the new XML format
  resultXml += "</DeliverRequest>"
  resultXml = resultXml.replace(/(\n|\t)/gm, "")
  return encodeBase64(resultXml)
}

export default (
  { messages, eventSourceArn }: AmazonMqEventSourceRecordEvent,
  messageFormat: MessageFormat
): Result => ({
  messages: messages.map((message) => ({
    messageData: castToOldMessageVersion(message.data),
    messageFormat,
    eventSourceArn,
    eventSourceQueueName: getEventSourceQueueName(message)
  }))
})
