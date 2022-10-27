import { useState } from "react"
import RetryIcon from "icons/RetryIcon"
import { Tooltip, IconButton } from '@material-core/ui'
import type { AuditLog } from "shared-types"
import If from "components/If"
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
