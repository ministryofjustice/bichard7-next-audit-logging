import { Tooltip } from "@material-ui/core"
import { AuditLog } from "shared"
import getStatusIcon from "./getStatusIcon"

interface Props {
  message: AuditLog
}

const StatusIcon = ({ message }: Props) => {
  const Icon = getStatusIcon(message.messageStatus)

  return (
    <Tooltip title={message.messageStatus} placement="top">
      <div>
        <Icon />
      </div>
    </Tooltip>
  )
}

export default StatusIcon
