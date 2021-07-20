import React from "react"
import RetryIcon from "icons/RetryIcon"
import { CircularProgress, IconButton, Tooltip } from "@material-ui/core"
import type { AuditLog } from "shared"
import If from "components/If"
import { RetryDialogConfirm } from "./RetryDialogConfirm"

interface Props {
  message: AuditLog
  isVisible: boolean
  isRetrying: boolean
}

export default function RetryDialogButton({ message, isVisible, isRetrying }: Props) {
  const [open, setOpen] = React.useState(false)
  const selectedValue = message

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <div>
      <If condition={isVisible}>
        {!isRetrying ? (
          <div>
            <IconButton color="default" onClick={handleClickOpen}>
              <RetryIcon />
            </IconButton>
            <RetryDialogConfirm selectedValue={selectedValue} open={open} onClose={handleClose} />
          </div>
        ) : (
          <div>
            <Tooltip title="Retrying" aria-label="retry">
              <CircularProgress color="secondary" />
            </Tooltip>
          </div>
        )}
      </If>
    </div>
  )
}
