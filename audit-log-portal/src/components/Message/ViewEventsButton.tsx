import Link from "next/link"
import { Badge, IconButton, Tooltip } from "@material-ui/core"
import type { AuditLog } from "shared"
import EventIcon from "icons/EventIcon"

interface Props {
  message: AuditLog
}

const ViewEventsButton = ({ message }: Props) => (
  <Badge badgeContent={(message.events || []).length} color="secondary">
    <Link href={`/messages/${message.messageId}`}>
      <Tooltip title="View events" aria-label="view">
        <IconButton>
          <EventIcon />
        </IconButton>
      </Tooltip>
    </Link>
  </Badge>
)

export default ViewEventsButton
