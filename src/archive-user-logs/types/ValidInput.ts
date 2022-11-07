import { z } from "zod"

const ValidInput = z.object({
  awslogs: z.object({
    data: z.string()
  })
})

export default ValidInput
