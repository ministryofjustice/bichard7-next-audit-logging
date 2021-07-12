import { ReactNode } from "react"
import { AuditLogEvent } from "shared"
import Header from "components/Header"
import Event from "components/Event"
import IF from "components/If"

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
    <IF condition={events.length === 0}>
      <NoEvents />
    </IF>

    <IF condition={events.length > 0}>
      <EventsContainer>
        <IF condition={events.length > 0}>
          {events.map((event) => (
            <Event key={event.timestamp} event={event} />
          ))}
        </IF>
      </EventsContainer>
    </IF>
  </>
)

export default Events
