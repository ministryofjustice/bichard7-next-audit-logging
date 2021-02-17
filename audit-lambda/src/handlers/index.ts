import { IncomingMessage } from "http";
import * as https from "https";
import { HandlerContext, HandlerEvent } from "../types";

exports.handler = (event: HandlerEvent, context: HandlerContext, callback: (error: Error, result: any) => void) => {
  const message = formatMessage(event.Records[0].body);

  const req = https.request(postOptions(), (res: IncomingMessage) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk: any) => body += chunk);
    res.on('end', () => {
      // If we know it's JSON, parse it
      if (res.headers['content-type'] === 'application/json') {
        body = JSON.parse(body);
      }
      if (res.statusCode == 201) {
        context.succeed(JSON.stringify(res.statusCode));
      } else {
        context.fail('Could not create MQ message');
      }
      callback(null, body);

    });
  });
  req.on('error', callback);
  req.write(message);
  req.end();
};

const formatMessage = (incomingMessage: string) => {
  const extractedMessageFeed = incomingMessage.match(/&lt;.*&gt;/)[0];

  const formatMessageFeed = (messageFeed: any) => {
    const addOpeningBrackets = messageFeed.replace(/&lt;/g, '<');
    const addClosingBrackets = addOpeningBrackets.replace(/&gt;/g, '>\n');
    return addClosingBrackets;
  }

  const formattedMessageFeed = formatMessageFeed(extractedMessageFeed);

  const convertedMessage = `<?xml version="1.0" encoding="UTF-8"?>
<DeliverRequest xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://schemas.cjse.gov.uk/messages/deliver/2006-05 C:\ClearCase\kel-masri_BR7_0_1_intg\BR7\XML_Converter\Source\ClassGeneration\schemas\ReceiveDeliverService\DeliverService-v1-0.xsd">
	<msg:MessageIdentifier>http://www.altova.com</msg:MessageIdentifier>
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
		${formattedMessageFeed}
	</Message>
</DeliverRequest>`

  return convertedMessage;
}

const postOptions = () => {
  const options: https.RequestOptions = {
    hostname: process.env.MQ_Endpoint,
    port: process.env.MQ_PortNumber,
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(process.env.MQ_Username + ':' + process.env.MQ_Password).toString('base64'),
      'Content-Type': 'text/plain',
      'ibm-mq-rest-csrf-token': 'blank' // Need this header for POST operations even if it has no content
    },
    path: '/ibmmq/rest/v2/messaging/qmgr/' + process.env.MQ_QueueManager + '/queue/' + process.env.MQ_Queue + '/message'
  };

  // For test purposes, permit the qmgr to use a self-signed cert. Would
  // want to point to a real keystore and truststore for secure production
  options.rejectUnauthorized = false;

  return options;
}
