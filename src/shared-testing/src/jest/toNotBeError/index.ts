/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Result } from "shared-types"
import { isError } from "shared-types"

declare global {
  namespace jest {
    interface Matchers<R> {
      toNotBeError(): any
    }
  }
}

expect.extend({
  toNotBeError(received: Result<any>): any {
    if (isError(received)) {
      return {
        message: () => received,
        pass: false
      }
    }

    return {
      pass: true
    }
  }
})
