import PollAction from "./PollAction"
import Poller from "./Poller"

const poll = async (
  timeout: number,
  numberOfIterations: number,
  shouldSucceed: boolean,
  condition?: (result: string) => boolean
): Promise<string> => {
  let iterations = 0

  const action: PollAction<string> = () =>
    new Promise((resolve) => {
      if (shouldSucceed && iterations === numberOfIterations && (!condition || condition("VALID"))) {
        resolve("Hello, World!")
      } else {
        iterations++
        resolve(undefined)
      }
    })

  const poller = new Poller<string>(action)
  return await poller.poll(timeout)
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
    const message = await poll(5000, 1, true, (result) => result === "VALID")

    expect(message).toBe("Hello, World!")
  })

  it("should fail when condition is invalid", async () => {
    let actualError: Error

    try {
      await poll(1000, 1, false, (result) => result !== "VALID")
    } catch (error) {
      actualError = error
    }

    expect(actualError).toBeDefined()
    expect(actualError.message).toBe("Failed polling due to exceeding the timeout")
  })
})
