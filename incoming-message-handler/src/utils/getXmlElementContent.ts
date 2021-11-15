export default (xml: string, elementName: string): string | undefined => {
  const regexPattern = new RegExp(
    `<([\\s\\S]+:)?${elementName}(\\s+[\\s\\S]*)?>(?<content>[\\s\\S]*)<\\/([\\s\\S]+:)?${elementName}>`
  )
  const result = xml.match(regexPattern)?.groups?.content?.trim()

  return result
}
