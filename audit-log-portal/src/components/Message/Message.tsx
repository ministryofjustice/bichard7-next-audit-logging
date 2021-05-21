import styled from "styled-components"
import DateTime from "components/DateTime"
import { AuditLog } from "shared"

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
  justify-content: space-between;
`

const Block = styled.div``

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

const Message = ({ message }: Props) => (
  <Container>
    <InnerContainer>
      <Block>
        <CorrelationId>{message.externalCorrelationId}</CorrelationId>

        <ReceivedDate>
          <DateTime date={message.receivedDate} prefix="Received: " />
        </ReceivedDate>
      </Block>

      {/* TODO: X Days Old */}
      {/* TODO: Button: View XML */}
      {/* TODO: Button: View Events */}
    </InnerContainer>
  </Container>
)

export default Message
