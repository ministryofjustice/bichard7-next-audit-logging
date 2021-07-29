import type { PromiseResult } from "shared"
import { isError } from "shared"
import type GetLastEventUseCase from "./GetLastEventUseCase"
import type RetrieveEventXmlFromS3 from "./RetrieveEventXmlFromS3UseCase"
import type CreateRetryingEventUseCase from "./CreateRetryingEventUseCase"
import type SendMessageToQueueUseCase from "./SendMessageToQueueUseCase"
import validateEventForRetry from "./validateEventForRetry"

export default class RetryMessageUseCase {
  constructor(
    private readonly getLastEventUseCase: GetLastEventUseCase,
    private readonly sendMessageToQueueUseCase: SendMessageToQueueUseCase,
    private readonly retrieveEventXmlFromS3UseCase: RetrieveEventXmlFromS3,
    private readonly createRetryingEventUseCase: CreateRetryingEventUseCase
  ) {}

  async retry(messageId: string): PromiseResult<void> {
    const event = await this.getLastEventUseCase.get(messageId)

    if (isError(event)) {
      return event
    }

    const eventValidationResult = validateEventForRetry(event)

    if (isError(eventValidationResult)) {
      return eventValidationResult
    }

    const eventXmlContent = await this.retrieveEventXmlFromS3UseCase.retrieve(event.s3Path)

    if (isError(eventXmlContent)) {
      return eventXmlContent
    }

    const sendMessageToQueueResult = await this.sendMessageToQueueUseCase.send(
      event.eventSourceQueueName,
      eventXmlContent
    )

    if (isError(sendMessageToQueueResult)) {
      return sendMessageToQueueResult
    }

    const createRetryingEventResult = await this.createRetryingEventUseCase.create(messageId)

    return createRetryingEventResult
  }
}
