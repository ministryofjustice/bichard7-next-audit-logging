import isTransactionFailedError from "./isTransactionFailedError"

export default function isTooManyEventsError(error: Error): [boolean, string] {
  if (isTransactionFailedError(error)) {
    return [
      error.failureReasons &&
        error.failureReasons.length > 0 &&
        error.failureReasons.some((reason) => reason.Code == "TooManyItems"),
      error.failureReasons[0].Message
    ]
  } else {
    return [false, ""]
  }
}
