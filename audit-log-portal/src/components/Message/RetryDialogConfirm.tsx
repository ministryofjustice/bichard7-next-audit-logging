import styled from "styled-components"
import React from "react"
import Button from "@material-ui/core/Button"
import DialogTitle from "@material-ui/core/DialogTitle"
import Dialog from "@material-ui/core/Dialog"
import { DialogActions, DialogContent, DialogContentText } from "@material-ui/core"
import type { AuditLog } from "shared"
import InformationIcon from "icons/InformationIcon/InformationIcon"

export interface SimpleDialogProps {
  open: boolean
  selectedValue: AuditLog
  onClose: () => void
}

const InfoParagraph = styled.div`
  vertical-align: middle;
`

const InfoText = styled.div`
  padding-left: 10px;
`

export function RetryDialogConfirm(props: SimpleDialogProps) {
  const { onClose, selectedValue, open } = props

  const triggerRetry = () => {
    // do nothing for now
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog aria-labelledby="retry-dialog-title" open={open}>
      <DialogTitle id="retry-dialog-title">Retry Message</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <InfoParagraph>
            <tr>
              <td>
                <InformationIcon />
              </td>
              <td>
                <InfoText>
                  Are you sure you wish to retry &quot;
                  {selectedValue.externalCorrelationId}
                  &quot; from the last failure?
                </InfoText>
              </td>
            </tr>
          </InfoParagraph>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={triggerRetry} color="primary" variant="contained">
          Yes
        </Button>
        <Button onClick={handleClose} color="default">
          No
        </Button>
      </DialogActions>
    </Dialog>
  )
}
