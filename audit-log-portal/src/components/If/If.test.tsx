/* eslint-disable react/jsx-boolean-value */
import { render } from "@testing-library/react"
import IF from "./If"

it("should not render children when condition is not valid", () => {
  const result = render(
    <IF condition={false}>
      <span>{`This text should not be rendered.`}</span>
    </IF>
  )

  expect(result.container.innerHTML).toBe("")
})

it("should render children when condition is valid", () => {
  const result = render(
    <IF condition={true}>
      <span>{`This text should be rendered.`}</span>
    </IF>
  )

  expect(result.container.innerHTML).toContain("This text should be rendered.")
})
