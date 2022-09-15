import type { TransactionFailedError } from "shared-types"

export default function isTransactionFailedError(error: Error): error is TransactionFailedError {
  return "failureReasons" in error
}
