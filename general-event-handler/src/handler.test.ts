import handler from "./handler"

describe("handler", () => {
  it("should return a string", () => {
    const expectedMessage = "Hello, World!"

    const actualMessage = handler()

    expect(actualMessage).toBe(expectedMessage)
  })
})
