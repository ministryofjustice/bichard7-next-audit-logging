import { parseStringPromise, processors } from "xml2js"

export const clean = (message: string): string => {
  return message.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
}

export const parseXml = async <T>(xml: string): Promise<T> => {
  const stripNamespaces = processors.stripPrefix
  return parseStringPromise(xml, { tagNameProcessors: [stripNamespaces], explicitArray: false }) as Promise<T>
}

export const hasRootElement = async <T extends { [key: string]: string }>(
  rawXml: string,
  elementName: string
): Promise<boolean> => {
  const xml = await parseXml<T>(rawXml)
  return !!xml[elementName]
}
