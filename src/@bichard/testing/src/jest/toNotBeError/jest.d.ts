/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
export {}

declare global {
  namespace jest {
    interface Matchers<R> {
      toNotBeError(): any
    }
  }
}
