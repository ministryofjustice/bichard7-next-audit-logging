import React from "react"
import Button from "@material-ui/core/Button"
import DialogTitle from "@material-ui/core/DialogTitle"
import Dialog from "@material-ui/core/Dialog"
import RetryIcon from "icons/RetryIcon"
import { DialogActions, IconButton } from "@material-ui/core"
import type { AuditLog } from "shared"

interface Props {
  message: AuditLog
}

export interface SimpleDialogProps {
  open: boolean
  selectedValue: AuditLog
  onClose: () => void
}

function RetryDialogConfirm(props: SimpleDialogProps) {
  const { onClose, selectedValue, open } = props

  const triggerRetry = () => {
    // do nothing for now
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={open}>
      <DialogTitle id="simple-dialog-title">
        Are you sure you wish to retry this event(s):
        {selectedValue.externalCorrelationId}
      </DialogTitle>
      <DialogActions>
        <Button onClick={triggerRetry} color="primary">
          Yes
        </Button>
        <Button onClick={handleClose} color="default">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function RetryDialogButton({ message }: Props) {
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
      <IconButton color="default" onClick={handleClickOpen}>
        <RetryIcon />
      </IconButton>

      <RetryDialogConfirm selectedValue={selectedValue} open={open} onClose={handleClose} />
    </div>
  )
}
