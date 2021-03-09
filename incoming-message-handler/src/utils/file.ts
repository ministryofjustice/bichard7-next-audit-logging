const pad = (value: number) => {
  if (value < 10) {
    return `0${value}`
  }
  return value
}

// eslint-disable-next-line import/prefer-default-export
export const getFileName = (date: Date, uniqueName: string): string => {
  const year = date.getFullYear()
  const month = pad(date.getMonth())
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}/${month}/${day}/${hour}/${minutes}/${uniqueName}.xml`
}
