import { IconButton, Tooltip } from "@material-ui/core"
import If from "components/If"
import RetryIcon from "icons/RetryIcon"
import { useState } from "react"
import type AuditLog from "types/AuditLog"
import RetryConfirmationDialog from "./RetryConfirmationDialog"

interface Props {
  message: AuditLog
  show: boolean
  isRetrying: boolean
  onRetry: () => void
}

const RetryButton = ({ message, show, isRetrying, onRetry }: Props) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <If condition={show}>
      <Tooltip title="Retry message" aria-label="retry">
        <IconButton onClick={() => setIsOpen(true)} disabled={isRetrying}>
          <RetryIcon spin={isRetrying} />
        </IconButton>
      </Tooltip>

      <RetryConfirmationDialog
        selectedValue={message}
        open={isOpen}
        onClose={(shouldRetry) => {
          setIsOpen(false)

          if (shouldRetry) {
            onRetry()
          }
        }}
      />
    </If>
  )
}

export default RetryButton
