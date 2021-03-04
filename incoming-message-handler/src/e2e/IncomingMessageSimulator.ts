import { SQS } from "aws-sdk"

export default class IncomingMessageSimulator {
  private queue: SQS

  constructor(private awsUrl: string) {
    this.queue = new SQS({
      endpoint: awsUrl,
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test"
      }
    })
  }

  async sendMessage(message: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.queue.sendMessage(
        {
          QueueUrl: `${this.awsUrl}/000000000000/incoming_message_queue`,
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
  }
}
