import type { ReceivedMessage } from "src/entities"

const containsBadUnicode = (input: string): boolean => !!input.match(/\p{Co}/gu)

export default (input: ReceivedMessage): void => {
  if (containsBadUnicode(input.messageXml)) {
    console.error(`Bad unicode character received in file: ${input.s3Path}`)
  }
}
