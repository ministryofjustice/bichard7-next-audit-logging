import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@material-ui/core"
import InformationIcon from "icons/InformationIcon"
import styled from "styled-components"
import type AuditLog from "types/AuditLog"

interface Props {
  open: boolean
  selectedValue: AuditLog
  onClose: (shouldRetry: boolean) => void
}

const InfoText = styled.div`
  padding-left: 10px;
`
const InfoParagraph = styled.div`
  display: flex;
  align-items: center;
`

const RetryConfirmationDialog = ({ open, selectedValue, onClose }: Props) => (
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
      <Button onClick={() => onClose(true)} color="primary" variant="contained">
        {`Yes`}
      </Button>
      <Button onClick={() => onClose(false)}>{`No`}</Button>
    </DialogActions>
  </Dialog>
)

export default RetryConfirmationDialog
