import React from "react"
import RetryIcon from "icons/RetryIcon"
import ProcessingIcon from "icons/ProcessingIcon"
import { IconButton, Tooltip } from "@material-ui/core"
import type { AuditLog } from "shared"
import If from "components/If"
import { RetryConfirmationDialog } from "./RetryConfirmationDialog"

interface Props {
  message: AuditLog
  show: boolean
  isRetrying: boolean
}

interface RetryButtonState {
  message: AuditLog
  show: boolean
  isOpen: boolean
  isRetrying: boolean
}

export default class RetryButton extends React.Component<Props, RetryButtonState> {
  constructor(props: Props) {
    super(props)
    this.state = { message: props.message, show: props.show, isOpen: false, isRetrying: props.isRetrying }
  }

  render() {
    const { message, show, isOpen, isRetrying } = this.state
    return (
      <If condition={show}>
        {isRetrying === true ? (
          <Tooltip title="Retrying" aria-label="retry">
            <ProcessingIcon />
          </Tooltip>
        ) : (
          <>
            <Tooltip title="Retry message" aria-label="retry">
              <IconButton
                onClick={() => {
                  this.setState({ isOpen: true })
                }}
              >
                <RetryIcon />
              </IconButton>
            </Tooltip>
            <RetryConfirmationDialog
              selectedValue={message}
              open={isOpen}
              onClose={(r) => {
                this.setState({ isOpen: false, isRetrying: r })
              }}
            />
          </>
        )}
      </If>
    )
  }
}
