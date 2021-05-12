import { isError, AuditLog } from "shared"
import CreateSentToBichardEventUseCase from "src/use-cases/CreateSentToBichardEventUseCase"

const createSentToBichardEventUseCase = new CreateSentToBichardEventUseCase(process.env.API_URL)

export default async function recordSentToBichardEvent(message: AuditLog): Promise<AuditLog> {
  const result = await createSentToBichardEventUseCase.create(message)

  if (isError(result)) {
    throw result
  }

  return message
}
