import { HttpStatusCode } from "shared"

const statusCodeLookup: { [k: string]: number } = {
  success: HttpStatusCode.ok,
  notFound: HttpStatusCode.notFound,
  invalidVersion: HttpStatusCode.conflict,
  transactionFailed: HttpStatusCode.conflict,
  error: HttpStatusCode.internalServerError,
  tooManyEvents: HttpStatusCode.badRequest
}

export default statusCodeLookup
