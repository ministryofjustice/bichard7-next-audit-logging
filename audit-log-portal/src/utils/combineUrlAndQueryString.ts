export default function combineUrlAndQueryString(baseUrl: string, queryString?: string): string {
  if (queryString.length > 0) {
    return `${baseUrl}?${queryString}`
  }

  return baseUrl
}
