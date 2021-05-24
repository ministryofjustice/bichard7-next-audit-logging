import styled from "styled-components"
import { Card, CardContent, Button, Typography } from "@material-ui/core"
import { AuditLog } from "shared"
import DateTime from "components/DateTime"
import EventIcon from "icons/EventIcon"
import getDaysOld from "./getDaysOld"

interface Props {
  message: AuditLog
}

const Container = styled(Card)`
  margin-bottom: 1rem;
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

const ReceivedDate = styled(Typography)`
  ${({ theme }) => `
    color: ${theme.palette.text.disabled};
  `}
`

const Actions = styled.div``

const Message = ({ message }: Props) => (
  <Container>
    <CardContent>
      <InnerContainer>
        <Block>
          <Typography variant="h6">{message.externalCorrelationId}</Typography>

          <ReceivedDate variant="caption">
            <DateTime date={message.receivedDate} prefix="Received: " />
          </ReceivedDate>
        </Block>

        <Typography variant="h6">{getDaysOld(message.receivedDate)}</Typography>

        <Actions>
          {/* TODO: Button: View XML */}
          <Button variant="outlined" color="default" startIcon={<EventIcon />}>
            {`View Events`}
          </Button>
        </Actions>
      </InnerContainer>
    </CardContent>
  </Container>
)

export default Message
