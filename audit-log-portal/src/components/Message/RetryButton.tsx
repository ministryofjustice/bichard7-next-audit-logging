import { useState } from "react"
import RetryIcon from "icons/RetryIcon"
import { IconButton, Tooltip } from "@material-ui/core"
import type { AuditLog } from "shared"
import If from "components/If"
import RetryConfirmationDialog from "./RetryConfirmationDialog"

interface Props {
  message: AuditLog
  show: boolean
  onRetry: () => void
}

const RetryButton = ({ message, show, onRetry }: Props) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <If condition={show}>
      <Tooltip title="Retry message" aria-label="retry">
        <IconButton onClick={() => setIsOpen(true)}>
          <RetryIcon />
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
