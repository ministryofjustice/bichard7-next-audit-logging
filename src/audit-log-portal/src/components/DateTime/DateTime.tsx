import { format } from "date-fns"

interface Props {
  date?: Date | string
  prefix?: string
}

const DateTime = ({ date, prefix }: Props) => {
  if (!date) {
    return <></>
  }

  const dateObject = new Date(date)

  return (
    <>
      {prefix}
      <time aria-label="time">{format(dateObject, "dd/MM/yyyy HH:mm:ss")}</time>
    </>
  )
}

export default DateTime
