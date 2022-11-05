export default interface CreateAuditLogEventsResult {
  resultType: "success" | "notFound" | "invalidVersion" | "transactionFailed" | "error" | "tooManyEvents"
  resultDescription?: string
}
