import { useState } from "react"
import RetryIcon from "icons/RetryIcon"
import { CircularProgress, IconButton, Tooltip } from "@material-ui/core"
import type { AuditLog } from "shared"
import If from "components/If"
import { RetryConfirmationDialog } from "./RetryConfirmationDialog"

interface Props {
  message: AuditLog
  show: boolean
  isRetrying: boolean
}

export default function RetryButton({ message, show, isRetrying }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <If condition={show}>
      {isRetrying ? (
        <>
          <Tooltip title="Retrying" aria-label="retry">
            <CircularProgress color="secondary" />
          </Tooltip>
        </>
      ) : (
        <>
          <IconButton onClick={() => setOpen(true)}>
            <RetryIcon />
          </IconButton>
          <RetryConfirmationDialog selectedValue={message} open={open} onClose={() => setOpen(false)} />
        </>
      )}
    </If>
  )
}
