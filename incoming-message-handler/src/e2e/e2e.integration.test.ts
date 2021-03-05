import TestDynamoGateway from "src/gateways/DynamoGateway/TestDynamoGateway"
import IncomingMessageSimulator from "./IncomingMessageSimulator"
import IbmMqService from "./IbmMqService"

jest.setTimeout(30000)

const gateway = new TestDynamoGateway({
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1"
})

const simulator = new IncomingMessageSimulator("http://localhost:4566")

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
    await gateway.deleteAll("IncomingMessage", "messageId")
  })

  it("should receive a message on the target queue when the message is sent to the AWS SQS queue", async () => {
    const expectedMessage = "Hello, World!"

    await mq.clearQueue()
    await simulator.sendMessage(expectedMessage)
    await waitFor(3000)

    // Check the message is in the database
    const persistedMessages = await gateway.getAll("IncomingMessage")
    expect(persistedMessages.Count).toBe(1)

    console.log(persistedMessages.Items[0])

    const actualMessage = await mq.getMessage()
    expect(actualMessage).toBe(expectedMessage)
  })
})
