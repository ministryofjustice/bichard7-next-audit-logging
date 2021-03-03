const pad = (value: number): string | number => {
  if (value < 10) {
    return `0${value}`
  }
  return value
}

const getMonthName = (month: number) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
  return months[month]
}

export const getDateAndMonthFormatted = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = getMonthName(today.getMonth())
  return `${month}-${year}`
}

export const getTimeFormatted = () => {
  const today = new Date()
  const hour = pad(today.getHours())
  const month = pad(today.getMinutes())
  const second = pad(today.getSeconds())
  return `${hour}-${month}-${second}`
}
