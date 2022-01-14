export default (xml: string, elementName: string): string | undefined => {
  const regexPattern = new RegExp(
    `<([^<]+:)?${elementName}(\\s+[^>]*)?>(?<content>[\\s\\S]*)<\\/([\\s\\S]+:)?${elementName}>`
  )
  return xml.match(regexPattern)?.groups?.content?.trim()
}
