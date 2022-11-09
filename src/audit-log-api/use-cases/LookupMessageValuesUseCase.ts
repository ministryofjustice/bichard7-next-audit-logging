import type { AuditLog, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type LookupEventValuesUseCase from "./LookupEventValuesUseCase"

export default class LookupMessageValuesUseCase {
  constructor(private lookupEventValuesUseCase: LookupEventValuesUseCase) {}

  async execute(message: AuditLog): PromiseResult<AuditLog> {
    if (!message.events) {
      return message
    }

    const events = []
    for (const fetchedEvent of message.events) {
      const lookupEventResult = await this.lookupEventValuesUseCase.execute(fetchedEvent)

      if (isError(lookupEventResult)) {
        return lookupEventResult
      }

      events.push(lookupEventResult)
    }

    message.events = events

    return message
  }
}