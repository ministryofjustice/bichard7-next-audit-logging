import type { EventMessage } from "shared"

export default interface TranslateEventInput extends EventMessage {
  s3Path: string
}
