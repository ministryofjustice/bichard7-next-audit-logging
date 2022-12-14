/*

This script reads a single message from a message queue. It can be used to clear stuck messages in failure queues

To read the message, run:
MQ_URL=<MQ URL> MQ_USER=<MQ user> MQ_PASSWORD=<MQ password> MQ_QUEUE=<MQ queue name> aws-vault exec {ACCOUNT} -- npx ts-node -T ./scripts/utils/read-message-from-queue.ts

If you are clearing a failure queue, you should manually add an event to the audit log  (find the ID from the downloaded message) with the following keys:
{
  "attributes": {},
  "category": "error",
  "eventSource": "Translate Event",
  "eventSourceQueueName": "COURT_RESULT_INPUT_QUEUE",
  "eventType": "Court Result Input Queue Failure",
  "timestamp": <the current time>
}
 
 Which will ensure it gets included in the Common Platform report
 */

import createMqConfig from "../../src/shared/MqGateway/createMqConfig"
import TestMqGateway from "../../src/shared/MqGateway/TestMqGateway"

const queueName = process.env.MQ_QUEUE ?? "COURT_RESULT_INPUT_QUEUE.FAILURE"

const mq = new TestMqGateway(createMqConfig())

const main = async () => {
  const message = await mq.getMessage(queueName)
  await mq.dispose()
  console.log(message)
}

main().catch((e) => console.error(e))
