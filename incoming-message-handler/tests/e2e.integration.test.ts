import { exec, ExecException } from "child_process"

const AWS_URL = "http://localhost:4566"

const sendMessage = async (): Promise<void> => {
  const command = `awslocal sqs send-message --queue-url=${AWS_URL}/000000000000/incoming_message_queue --message-body "HelloWorld"`

  return new Promise<void>((resolve, reject) => {
    exec(command, (error: ExecException | null) => {
      if (error) {
        reject(error)
      }

      resolve()
    })
  })
}

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
