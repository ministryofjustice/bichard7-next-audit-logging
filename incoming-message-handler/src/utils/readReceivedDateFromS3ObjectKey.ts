export default function readReceivedDateFromS3ObjectKey(key: string): Date {
  const segments = key.split("/")

  if (segments.length < 6) {
    throw new Error(`The object key "${key}" is in an invalid format`)
  }

  const year = +segments[0]

  // Subtract 1 from the month to account for the zero-based offset
  // See: https://stackoverflow.com/a/12254344/308012
  const month = +segments[1] - 1

  const day = +segments[2]
  const hour = +segments[3]
  const minute = +segments[4]

  return new Date(year, month, day, hour, minute)
}
