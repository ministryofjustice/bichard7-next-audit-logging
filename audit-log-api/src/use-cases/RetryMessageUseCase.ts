import type { PromiseResult } from "shared"
import { decodeBase64, isError } from "shared"

import type GetLastFailedMessageEventUseCase from "./GetLastEventUseCase"
import type RetrieveEventXmlFromS3 from "./RetrieveEventXmlFromS3UseCase"
import type CreateRetryingEventUseCase from "./CreateRetryingEventUseCase"
import type SendMessageToQueueUseCase from "./SendMessageToQueueUseCase"
import validateEventForRetry from "./validateEventForRetry"

export default class RetryMessageUseCase {
  constructor(
    private readonly getLastFailedMessageEventUseCase: GetLastFailedMessageEventUseCase,
    private readonly sendMessageToQueueUseCase: SendMessageToQueueUseCase,
    private readonly retrieveEventXmlFromS3UseCase: RetrieveEventXmlFromS3,
    private readonly createRetryingEventUseCase: CreateRetryingEventUseCase
  ) {}

  async retry(messageId: string): PromiseResult<void> {
    console.log(`Retrying message ${messageId}`)
    const event = await this.getLastFailedMessageEventUseCase.get(messageId)

    if (isError(event)) {
      return event
    }

    const eventValidationResult = validateEventForRetry(event)

    if (isError(eventValidationResult)) {
      return eventValidationResult
    }

    const eventContent = await this.retrieveEventXmlFromS3UseCase.retrieve(event.s3Path)

    if (isError(eventContent)) {
      return eventContent
    }

    let eventJsonContent

    try {
      eventJsonContent = JSON.parse(eventContent)
    } catch (err) {
      return isError(err) ? err : Error("Error parsing JSON from S3 object")
    }

    if (!eventJsonContent.messageData) {
      return Error(`Event JSON does not have required 'messageData' key`)
    }

    const eventMessage = decodeBase64(eventJsonContent.messageData)

    if (!eventMessage) {
      return Error(`Could not base64 decode event message`)
    }

    const sendMessageToQueueResult = await this.sendMessageToQueueUseCase.send(event.eventSourceQueueName, eventMessage)

    if (isError(sendMessageToQueueResult)) {
      return sendMessageToQueueResult
    }

    console.log("Message successfully sent to queue")

    return this.createRetryingEventUseCase.create(messageId)
  }
}
