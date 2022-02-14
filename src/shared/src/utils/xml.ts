import { parseString, processors } from "xml2js"

export const clean = (message: string): string => {
  return message.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
}

export const parseXml = <T>(xml: string): Promise<T> => {
  const stripNamespaces = processors.stripPrefix
  return new Promise<T>((resolve, reject) => {
    parseString(
      xml,
      {
        tagNameProcessors: [stripNamespaces],
        explicitArray: false,
        trim: true,
        ignoreAttrs: true
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      }
    )
  })
}

export const hasRootElement = async <T extends { [key: string]: string }>(
  rawXml: string,
  elementName: string
): Promise<boolean> => {
  const xml = await parseXml<T>(rawXml)
  return !!xml[elementName]
}
