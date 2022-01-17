import type { EventMessage } from "shared-types"

export default interface EventInput extends EventMessage {
  s3Path: string
}
