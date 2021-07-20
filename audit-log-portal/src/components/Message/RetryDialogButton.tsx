import { useState } from "react"
import RetryIcon from "icons/RetryIcon"
import { CircularProgress, IconButton, Tooltip } from "@material-ui/core"
import type { AuditLog } from "shared"
import If from "components/If"
import { RetryDialogConfirm } from "./RetryDialogConfirm"

interface Props {
  message: AuditLog
  show: boolean
  isRetrying: boolean
}

export default function RetryDialogButton({ message, show, isRetrying }: Props) {
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
          <RetryDialogConfirm selectedValue={message} open={open} onClose={() => setOpen(false)} />
        </>
      )}
    </If>
  )
}
