import type { FailedItem } from "./FailedItem"

export type TransferMessagesResult = {
  successful: string[]
  failedToCopy: FailedItem[]
  failedToDelete: FailedItem[]
}
