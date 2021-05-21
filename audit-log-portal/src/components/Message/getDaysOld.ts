import { formatDistance } from "date-fns"

export default (date: Date | string): string => {
  const today = new Date()
  const actualDate = new Date(date)

  return formatDistance(actualDate, today, { addSuffix: true }).replace("ago", "old")
}
