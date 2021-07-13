/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Result } from "shared"
import { isError } from "shared"

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
