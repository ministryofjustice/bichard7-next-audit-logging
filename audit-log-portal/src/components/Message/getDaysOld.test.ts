import { subDays } from "date-fns"
import getDaysOld from "./getDaysOld"

test("1 day old", () => {
  const today = new Date()
  const date = subDays(today, 1)

  const result = getDaysOld(date)

  expect(result).toBe("1 day old")
})

test("3 days old", () => {
  const today = new Date()
  const date = subDays(today, 3)

  const result = getDaysOld(date)

  expect(result).toBe("3 days old")
})
