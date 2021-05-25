import ErrorIcon from "icons/ErrorIcon"
import WarningIcon from "icons/WarningIcon"
import InformationIcon from "icons/InformationIcon"
import getCategoryIcon from "./getCategoryIcon"

test("returns <ErrorIcon /> when category is error", () => {
  const Component = getCategoryIcon("error")

  expect(Component).toBe(ErrorIcon)
})

test("returns <WarningIcon /> when category is warning", () => {
  const Component = getCategoryIcon("warning")

  expect(Component).toBe(WarningIcon)
})

test("returns <InformationIcon /> when category is information", () => {
  const Component = getCategoryIcon("information")

  expect(Component).toBe(InformationIcon)
})
