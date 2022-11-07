import Event from "components/Event"
import If from "components/If"
import type { ReactNode } from "react"
import type AuditLogEvent from "types/AuditLogEvent"

interface Props {
  events: AuditLogEvent[]
}

const NoEvents = () => (
  <p aria-label="No Events">
    <i>{`No events`}</i>
  </p>
)

const EventsContainer = ({ children }: { children: ReactNode }) => <div aria-label="Events">{children}</div>

const Events = ({ events }: Props) => (
  <>
    <If condition={events.length === 0}>
      <NoEvents />
    </If>

    <If condition={events.length > 0}>
      <EventsContainer>
        <If condition={events.length > 0}>
          {events.map((event) => (
            <Event key={event.timestamp} event={event} />
          ))}
        </If>
      </EventsContainer>
    </If>
  </>
)

export default Events
