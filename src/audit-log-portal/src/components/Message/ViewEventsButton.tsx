import { Badge, IconButton, Tooltip } from "@material-ui/core"
import EventIcon from "icons/EventIcon"
import Link from "next/link"
import type AuditLog from "types/AuditLog"

interface Props {
  message: AuditLog
}

const ViewEventsButton = ({ message }: Props) => (
  <Badge badgeContent={(message.events || []).length} color="secondary">
    <Link href={`/messages/${message.messageId}`} passHref={true}>
      <Tooltip title="View events" aria-label="view">
        <IconButton>
          <EventIcon />
        </IconButton>
      </Tooltip>
    </Link>
  </Badge>
)

export default ViewEventsButton
