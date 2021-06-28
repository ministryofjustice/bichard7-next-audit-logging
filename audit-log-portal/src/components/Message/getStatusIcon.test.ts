import ErrorIcon from "icons/ErrorIcon"
import SuccessIcon from "icons/SuccessIcon"
import ProcessingIcon from "icons/ProcessingIcon"
import getStatusIcon from "./getStatusIcon"

interface TestInput {
  status: string
  expectedIcon: () => JSX.Element
}

test.each<TestInput>([
  { status: "Error message", expectedIcon: ErrorIcon },
  { status: "Completed", expectedIcon: SuccessIcon },
  { status: "Processing", expectedIcon: ProcessingIcon }
])("returns <$expected/> when status is $status", ({ status, expectedIcon }) => {
  const Component = getStatusIcon(status)
  expect(Component).toBe(expectedIcon)
})
