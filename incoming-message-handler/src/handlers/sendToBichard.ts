import type { AuditLog } from "shared"
import { isError } from "shared"
import { createMqConfig } from "src/configs"
import MqGateway from "src/gateways/MqGateway"
import replaceMessageIdInXml from "src/use-cases/replaceMessageIdInXml"
import SendMessageUseCase from "src/use-cases/SendMessageUseCase"

const config = createMqConfig()
const gateway = new MqGateway(config)
const sendMessageUseCase = new SendMessageUseCase(gateway)

const castToOldMessageVersion = function (transformedXml: string) {
  let resultXml = transformedXml
  resultXml = resultXml.replace("RouteData", "DeliverRequest")

  let organizationalUnitID = ""
  let messageType = ""
  let messageContent = ""
  let correlationID = ""

  let match = resultXml.match(/<OrganizationalUnitID>([^<]*)<\/OrganizationalUnitID>/)
  if (match && match.length > 1) {
    ;[, organizationalUnitID] = match
  }

  match = resultXml.match(/<DataStreamType literalvalue="String">([^<]*)<\/DataStreamType>/)
  if (match && match.length > 1) {
    ;[, messageType] = match
  }

  match = resultXml.match(/<CorrelationID>([^<]*)<\/CorrelationID>/)
  if (match && match.length > 1) {
    ;[, correlationID] = match
  }

  match = resultXml.match(/<DataStreamContent>([^<]*)<\/DataStreamContent>/)
  if (match && match.length > 1) {
    ;[, messageContent] = match
  }

  // remove the request from and replace it with old version of xml
  resultXml = resultXml.replace(
    /<RequestFromSystem VersionNumber="1.0">([^<]*)<\/RequestFromSystem>/,
    `<msg:MessageIdentifier>
    ${correlationID}
  </msg:MessageIdentifier>
	<msg:RequestingSystem>
		<msg:Name>CJSE</msg:Name>
		<msg:OrgUnitCode>${organizationalUnitID}</msg:OrgUnitCode>
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
	</mf:MessageFormat>`
  )

  // add the message content (this should still have the same format as before)
  resultXml = resultXml.replace(
    /<DataStream VersionNumber="1.0">([^<]*)<\/DataStreamType>/,
    `<Message>
    ${messageContent}
  </Message>`
  )

  resultXml = resultXml.replace(/<Routes VersionNumber="1.0">([^<]*)<\/Routes>/, ``) // remove the last portion of the new XML format
  return resultXml
}

export default async function sendToBichard(event: AuditLog): Promise<AuditLog> {
  const transformedXml = castToOldMessageVersion(replaceMessageIdInXml(event))
  const result = await sendMessageUseCase.send(transformedXml)

  if (isError(result)) {
    throw result
  }

  return event
}
