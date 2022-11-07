import type { EventMessage } from "src/shared/types"

export default interface EventInput extends EventMessage {
  s3Path: string
}
