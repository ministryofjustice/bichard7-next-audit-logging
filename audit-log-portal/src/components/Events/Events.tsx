import { ReactNode } from "react"
import { AuditLogEvent } from "shared"
import Header from "components/Header"
import Event from "components/Event"

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
    {events.length === 0 && <NoEvents />}

    {events.length > 0 && (
      <EventsContainer>
        {events.length > 0 && events.map((event) => <Event key={event.timestamp} event={event} />)}
      </EventsContainer>
    )}
  </>
)

export default Events
