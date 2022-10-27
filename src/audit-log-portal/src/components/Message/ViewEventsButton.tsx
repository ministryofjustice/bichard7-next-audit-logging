import Link from "next/link"
import { Badge, IconButton, Tooltip } from '@material-core/ui';
import type { AuditLog } from "shared-types"
import EventIcon from "icons/EventIcon"

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
