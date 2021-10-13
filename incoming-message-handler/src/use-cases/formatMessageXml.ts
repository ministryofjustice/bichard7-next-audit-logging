import { v4 as uuidv4 } from "uuid"

const formatMessageXml = (message: string): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <DeliverRequest xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <msg:MessageIdentifier>${uuidv4()}</msg:MessageIdentifier>
        <msg:RequestingSystem>
            <msg:Name>CJSE</msg:Name>
            <msg:OrgUnitCode>Z000000</msg:OrgUnitCode>
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
                <msg:Type>SPIResults</msg:Type>
                <msg:Version>1.200</msg:Version>
            </mf:MessageType>
            <mf:MessageSchema>
                <msg:Namespace>http://www.dca.gov.uk/xmlschemas/libra</msg:Namespace>
                <msg:Version>TBC</msg:Version>
            </mf:MessageSchema>
        </mf:MessageFormat>
        <Message>
          ${message}
        </Message>
    </DeliverRequest>`
}

export default formatMessageXml
