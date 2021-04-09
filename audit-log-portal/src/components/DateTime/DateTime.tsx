import React from "react"
import Moment from 'react-moment'

interface Props {
  date: Date | string
}

const DateTime = ({ date }: Props) => {
  if (!date)
    return (<></>)

  const dateObject = new Date(date)

  return (
    <Moment date={dateObject} format="DD/MM/YYYY HH:mm:ss"></Moment>
  )
}

export default DateTime
