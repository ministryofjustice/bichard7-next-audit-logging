import { format } from "date-fns"

interface Props {
  date?: Date | string
}

const DateTime = ({ date }: Props) => {
  if (!date) {
    return <></>
  }

  const dateObject = new Date(date)

  return <time aria-label="time">{format(dateObject, "dd/MM/yyyy HH:mm:ss")}</time>
}

export default DateTime
