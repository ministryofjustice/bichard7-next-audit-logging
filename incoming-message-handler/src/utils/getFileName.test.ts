import getFileName from "./getFileName"

describe("getFileName", () => {
  it("should get the full path for the file to be saved", async () => {
    const date = new Date(2021, 3, 9, 12, 6)
    const messageId = "123456"
    const expectedResult = `2021/04/09/12/06/${messageId}.xml`
    const actualResult = getFileName(date, messageId)
    expect(actualResult).toBe(expectedResult)
  })
})
