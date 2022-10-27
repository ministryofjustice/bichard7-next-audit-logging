import { Tooltip } from '@material-core/ui'
import type { AuditLog } from "shared-types"
import getStatusIcon from "./getStatusIcon"

interface Props {
  message: AuditLog
}

const StatusIcon = ({ message }: Props) => {
  const Icon = getStatusIcon(message.status)

  return (
    <Tooltip title={message.lastEventType || message.status} placement="top">
      <div>
        <Icon />
      </div>
    </Tooltip>
  )
}

export default StatusIcon
