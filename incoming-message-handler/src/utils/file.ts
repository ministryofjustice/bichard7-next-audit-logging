const pad = (value: number) => {
  return String(value).padStart(2, "0")
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
