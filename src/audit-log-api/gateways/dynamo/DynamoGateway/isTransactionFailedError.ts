import type { TransactionFailedError } from "src/shared/types"

export default function isTransactionFailedError(error: Error): error is TransactionFailedError {
  return "failureReasons" in error
}
