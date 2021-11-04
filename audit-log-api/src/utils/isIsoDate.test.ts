import isIsoDate from "./isIsoDate"

it("should return true when date format is ISO", () => {
  const result = isIsoDate("2021-10-05T10:12:13.000Z")

  expect(result).toBe(true)
})

it("should return false when date format is not ISO", () => {
  const result = isIsoDate("2021-10-05 10:12:13")

  expect(result).toBe(false)
})

it("should return false when date format is empty", () => {
  const result = isIsoDate("")

  expect(result).toBe(false)
})
