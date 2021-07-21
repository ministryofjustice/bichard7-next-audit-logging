import styled from "styled-components"
import React from "react"
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@material-ui/core"
import type { AuditLog } from "shared"
import InformationIcon from "icons/InformationIcon"

export interface SimpleDialogProps {
  open: boolean
  selectedValue: AuditLog
  onClose: () => void
}

const InfoText = styled.div`
  padding-left: 10px;
`
const InfoParagraph = styled.div`
  display: flex;
  align-items: center;
`

export function RetryConfirmationDialog(props: SimpleDialogProps) {
  const { onClose, selectedValue, open } = props

  const triggerRetry = () => {
    /* do nothing for now */
  }

  return (
    <Dialog aria-labelledby="retry-dialog-title" open={open}>
      <DialogTitle id="retry-dialog-title">Retry Message</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <InfoParagraph>
            <InformationIcon />
            <InfoText>
              {`Are you sure you wish to retry "${selectedValue.externalCorrelationId}" from the last failure?`}
            </InfoText>
          </InfoParagraph>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={triggerRetry} color="primary" variant="contained">
          Yes
        </Button>
        <Button onClick={() => onClose()}>No</Button>
      </DialogActions>
    </Dialog>
  )
}
