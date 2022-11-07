import ErrorIcon from "icons/ErrorIcon"
import InformationIcon from "icons/InformationIcon"
import WarningIcon from "icons/WarningIcon"
import type EventCategory from "types/EventCategory"
import getCategoryIcon from "./getCategoryIcon"

interface TestInput {
  category: EventCategory
  expectedIcon: () => JSX.Element
}

test.each<TestInput>([
  { category: "error", expectedIcon: ErrorIcon },
  { category: "warning", expectedIcon: WarningIcon },
  { category: "information", expectedIcon: InformationIcon }
])("returns <$expectedIcon/> when category is $category", ({ category, expectedIcon }: TestInput) => {
  const Component = getCategoryIcon(category)
  expect(Component).toBe(expectedIcon)
})
