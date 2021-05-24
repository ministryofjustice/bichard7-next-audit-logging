import { render, screen } from "@testing-library/react"
import DateTime from "./DateTime"

test("matches snapshot", () => {
  const date = new Date("2021-05-21T08:27")

  const { container } = render(<DateTime date={date} />)

  expect(container).toMatchSnapshot()
})

test("has correct date time format when date is type of Date", () => {
  const date = new Date("2021-04-01T13:20:30")
  const expectedDateString = "01/04/2021 13:20:30"

  render(<DateTime date={date} />)

  const time = screen.getByLabelText("time")
  expect(time.innerHTML).toBe(expectedDateString)
})

test("has correct date time format when date is type of String", () => {
  const dateString = "2021-04-01T13:20:30"
  const expectedDateString = "01/04/2021 13:20:30"

  render(<DateTime date={dateString} />)

  const time = screen.getByLabelText("time")
  expect(time.innerHTML).toBe(expectedDateString)
})

test("not rendered when date has no value", () => {
  render(<DateTime date={null} />)

  const time = screen.queryByLabelText("time")
  expect(time).toBeNull()
})
