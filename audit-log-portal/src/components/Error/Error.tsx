import { Alert } from "@material-ui/lab"

interface Props {
  message: string
}

const Error = ({ message }: Props) => <Alert severity="error">{message}</Alert>

export default Error
