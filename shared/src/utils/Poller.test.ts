import PollAction from "./PollAction"
import Poller, { PollCondition, PollOptions } from "./Poller"

const expectedResult = "Hello, World!"

const poll = async (
  timeout: number,
  numberOfIterations: number,
  shouldSucceed: boolean,
  condition?: PollCondition<string>
): Promise<string> => {
  let iterations = 0

  const action: PollAction<string> = () =>
    new Promise((resolve) => {
      if (shouldSucceed && iterations === numberOfIterations) {
        resolve(expectedResult)
      } else {
        iterations++
        resolve(undefined)
      }
    })

  const poller = new Poller<string>(action)
  const options: PollOptions<string> = { timeout, condition }

  return await poller.poll(options)
}

describe("Poller", () => {
  it("should succeed when the item is found", async () => {
    const message = await poll(5000, 1, true)

    expect(message).toBe("Hello, World!")
  })

  it("should take 3 seconds to find the item", async () => {
    const message = await poll(5000, 3, true)

    expect(message).toBe("Hello, World!")
  })

  it("should fail when the timeout is exceeded", async () => {
    let actualError: Error

    try {
      await poll(1000, 1, false)
    } catch (error) {
      actualError = error
    }

    expect(actualError).toBeDefined()
    expect(actualError.message).toBe("Failed polling due to exceeding the timeout")
  })

  it("should succeed when condition is valid", async () => {
    const message = await poll(6000, 1, true, (result) => result === expectedResult)

    expect(message).toBe("Hello, World!")
  })

  it("should fail when condition is invalid", async () => {
    let actualError: Error

    try {
      await poll(1000, 1, false, (result) => result === expectedResult)
    } catch (error) {
      actualError = error
    }

    expect(actualError).toBeDefined()
    expect(actualError.message).toBe("Failed polling due to exceeding the timeout")
  })
})
