import ErrorIcon from "icons/ErrorIcon"
import SuccessIcon from "icons/SuccessIcon"
import ProcessingIcon from "icons/ProcessingIcon"
import { AuditLogStatus } from "shared"
import getStatusIcon from "./getStatusIcon"

interface TestInput {
  status: string
  expectedIcon: () => JSX.Element
}

test.each<TestInput>([
  { status: AuditLogStatus.error, expectedIcon: ErrorIcon },
  { status: AuditLogStatus.completed, expectedIcon: SuccessIcon },
  { status: AuditLogStatus.processing, expectedIcon: ProcessingIcon }
])("returns <$expected/> when status is $status", ({ status, expectedIcon }) => {
  const Component = getStatusIcon(status)
  expect(Component).toBe(expectedIcon)
})
