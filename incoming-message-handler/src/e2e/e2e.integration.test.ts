import TestDynamoGateway from "../gateways/DynamoGateway/TestDynamoGateway"
import IncomingMessage from "../entities/IncomingMessage"
import IncomingMessageSimulator from "./IncomingMessageSimulator"
import IbmMqService from "./IbmMqService"
import TestS3Gateway from "../gateways/S3Gateway/TestS3Gateway"

jest.setTimeout(30000)

const AWS_URL = "http://localhost:4566"
const REGION = "us-east-1"

const dynamoGateway = new TestDynamoGateway({
  DYNAMO_URL: AWS_URL,
  DYNAMO_REGION: REGION
})

const s3Gateway = new TestS3Gateway({
  S3_URL: AWS_URL,
  S3_REGION: REGION,
  S3_FORCE_PATH_STYLE: "true",
  INCOMING_MESSAGE_BUCKET_NAME: "incoming-messages"
})

const simulator = new IncomingMessageSimulator(AWS_URL)

const mq = new IbmMqService({
  MQ_HOST: "localhost",
  MQ_PORT: "10443",
  MQ_QUEUE_MANAGER: "BR7_QM",
  MQ_QUEUE: "DEV.QUEUE.1",
  MQ_USER: "app",
  MQ_PASSWORD: "passw0rd"
})

const waitFor = (milliseconds: number): Promise<void> =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), milliseconds))

describe("integration tests", () => {
  beforeEach(async () => {
    await dynamoGateway.deleteAll("IncomingMessage", "messageId")
    await s3Gateway.deleteAll()
  })

  it("should receive a message on the target queue when the message is sent to the AWS SQS queue", async () => {
    const expectedMessage = "Hello, World!"

    await mq.clearQueue()
    await simulator.sendMessage(expectedMessage)
    await waitFor(3000)

    const savedMessages = await s3Gateway.getAll()
    expect(savedMessages.length).toBe(1)

    const savedMessage = savedMessages[0]
    const messageContent = await s3Gateway.getContent(savedMessage.Key)
    expect(messageContent).toBe(expectedMessage)

    // Check the message is in the database
    const persistedMessages = await dynamoGateway.getAll("IncomingMessage")
    expect(persistedMessages.Count).toBe(1)

    const persistedMessage = <IncomingMessage>persistedMessages.Items[0]
    expect(persistedMessage.messageId).toBe(expectedMessage)

    const actualMessage = await mq.getMessage()
    expect(actualMessage).toBe(expectedMessage)
  })
})
