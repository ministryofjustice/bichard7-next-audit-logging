import styled from "styled-components"
import Button from "components/Button"
import DateTime from "components/DateTime"
import EventIcon from "icons/EventIcon"
import { AuditLog } from "shared"
import getDaysOld from "./getDaysOld"

interface Props {
  message: AuditLog
}

const Container = styled.div`
  display: block;
  margin-bottom: 1rem;
  border: 1px solid ${(props) => props.theme.colors.primary};
  padding: 0.75rem;
`

const InnerContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const Block = styled.div`
  margin-right: 1.5rem;
`

const CorrelationId = styled.div`
  display: block;
  font-weight: bold;
  margin-bottom: 0.25rem;
`

const ReceivedDate = styled.div`
  display: block;
  font-style: italic;
  color: ${(props) => props.theme.colors.muted};
`

const DaysOld = styled(Block)`
  font-size: large;
`

const Actions = styled.div``

const Message = ({ message }: Props) => (
  <Container>
    <InnerContainer>
      <Block>
        <CorrelationId>{message.externalCorrelationId}</CorrelationId>

        <ReceivedDate className="text-sm">
          <DateTime date={message.receivedDate} prefix="Received: " />
        </ReceivedDate>
      </Block>

      <DaysOld>{getDaysOld(message.receivedDate)}</DaysOld>

      <Actions>
        {/* TODO: Button: View XML */}
        <Button icon={<EventIcon />}>{`View Events (${(message.events || []).length})`}</Button>
      </Actions>
    </InnerContainer>
  </Container>
)

export default Message
