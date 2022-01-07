/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Result } from "shared-types"
import { isError } from "shared-types"

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeError(message: string): any
    }
  }
}

expect.extend({
  toBeError(received: Result<any>, message: string): any {
    if (!isError(received) || received.message !== message) {
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
