import { SQS } from "aws-sdk"

jest.setTimeout(30000)

const AWS_URL = "http://localhost:4566"

const queue = new SQS({
  endpoint: AWS_URL,
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test"
  }
})

const sendMessage = async (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    queue.sendMessage(
      {
        QueueUrl: `${AWS_URL}/000000000000/incoming_message_queue`,
        MessageBody: "Hello, World"
      },
      (error) => {
        if (error) {
          reject(error)
        }

        resolve()
      }
    )
  })

describe("integration tests", () => {
  it("should receive a message on the target queue when the message is sent to the AWS SQS queue", async () => {
    // TODO: Subscribe to IBM MQ queue.
    // TODO: Send a message to SQS.
    // TODO: Did we get a message?
    //          Yes - verify the message is correct
    //          No - timeout and fail
    // TODO: Can we setup some special logging mechanism and read the logs here?

    await sendMessage()

    expect(true).toBe(true)
  })
})
