import { Alert } from '@material-ui/lab'
import If from "components/If"

interface Props {
  message: string
  visibleIf: boolean
}

const Error = ({ message, visibleIf }: Props) => (
  <If condition={visibleIf}>
    <Alert severity="error">{message}</Alert>
  </If>
)

export default Error
