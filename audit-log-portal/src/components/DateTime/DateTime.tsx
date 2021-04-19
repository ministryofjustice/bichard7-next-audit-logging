import { format } from "date-fns"

interface Props {
  date?: Date | string
}

const DateTime = ({ date }: Props): JSX.Element => {
  if (!date) {
    return <></>
  }

  const dateObject = new Date(date)

  return <time>{format(dateObject, "dd/MM/yyyy HH:mm:ss")}</time>
}

DateTime.defaultProps = {
  date: null
}

export default DateTime
