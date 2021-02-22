import { SQS } from "aws-sdk"
import axios, { AxiosError } from "axios"
import * as https from "https"

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

const sendMessage = async (message: string): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    queue.sendMessage(
      {
        QueueUrl: `${AWS_URL}/000000000000/incoming_message_queue`,
        MessageBody: message
      },
      (error) => {
        if (error) {
          reject(error)
        }

        resolve()
      }
    )
  })

const waitFor = (milliseconds: number): Promise<void> =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), milliseconds))

const getMessage = async (): Promise<any> =>
  new Promise<any>((resolve, reject) => {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    })

    const url = "https://app:passw0rd@localhost:10443/ibmmq/rest/v1/messaging/qmgr/BR7_QM/queue/DEV.QUEUE.1/message"

    axios
      .delete(url, {
        headers: {
          "ibm-mq-rest-csrf-token": "blank",
          "Content-Type": "text/plain;charset=utf-8"
        },
        httpsAgent
      })
      .then((response: any) => {
        const body = response && response.data && response.data.body
        if (body) {
          resolve(body)
        } else {
          console.log(response)
          reject("Received a response but no body")
        }
      })
      .catch((error: AxiosError) => reject(error))
  })

describe("integration tests", () => {
  it("should receive a message on the target queue when the message is sent to the AWS SQS queue", async () => {
    const expectedMessage = "Hello, World!"

    await sendMessage(expectedMessage)
    await waitFor(3000)

    const actualMessage = await getMessage()
    expect(actualMessage).toBe(expectedMessage)
  })
})
