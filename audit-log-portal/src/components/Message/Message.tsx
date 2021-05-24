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
  background-color: white;
  border-bottom-color: rgb(229, 231, 235);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px,
    rgba(0, 0, 0, 0.06) 0px 2px 4px -1px;
  margin-bottom: 1rem;
  padding: 1.25rem;
`

const InnerContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
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

const ButtonText = styled.span`
  white-space: nowrap;
`

const Message = ({ message }: Props) => (
  <>
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
          <Button icon={<EventIcon />}>
            <ButtonText>{`View Events (${(message.events || []).length})`}</ButtonText>
          </Button>
        </Actions>
      </InnerContainer>
    </Container>
  </>
)

export default Message
