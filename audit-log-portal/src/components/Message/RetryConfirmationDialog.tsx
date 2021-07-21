import styled from "styled-components"
import React from "react"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@material-ui/core"
import type { AuditLog } from "shared"
import InformationIcon from "icons/InformationIcon"

export interface SimpleDialogProps {
  open: boolean
  selectedValue: AuditLog
  onClose: (r: boolean) => void
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
    // add config logic here
    // fetch(`${config.apiUrl}/messages/${selectedValue.messageId}/retry`, {method: 'POST'});
    onClose(true)
  }

  return (
    <Dialog aria-labelledby="retry-dialog-title" open={open}>
      <DialogTitle id="retry-dialog-title">Retry Message</DialogTitle>
      <DialogContent>
        <InfoParagraph>
          <InformationIcon />
          <InfoText>
            {`Are you sure you wish to retry "${selectedValue.externalCorrelationId}" from the last failure?`}
          </InfoText>
        </InfoParagraph>
      </DialogContent>
      <DialogActions>
        <Button onClick={triggerRetry} color="primary" variant="contained">
          {`Yes`}
        </Button>
        <Button onClick={() => onClose(false)}>{`No`}</Button>
      </DialogActions>
    </Dialog>
  )
}
