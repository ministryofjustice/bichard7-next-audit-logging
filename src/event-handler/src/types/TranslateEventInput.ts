import type { EventMessage } from "shared-types"

export default interface TranslateEventInput extends EventMessage {
  s3Path: string
}
