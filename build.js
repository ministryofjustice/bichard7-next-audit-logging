require("esbuild")
  .build({
    entryPoints: [
      "src/add-archival-events/index.ts",
      "src/archive-user-logs/index.ts",
      "src/audit-log-api/handlers/createAuditLog.ts",
      "src/audit-log-api/handlers/createAuditLogEvent.ts",
      "src/audit-log-api/handlers/createAuditLogEvents.ts",
      "src/audit-log-api/handlers/createAuditLogs.ts",
      "src/audit-log-api/handlers/getEvents.ts",
      "src/audit-log-api/handlers/getMessages.ts",
      "src/audit-log-api/handlers/retryMessage.ts",
      "src/audit-log-api/handlers/sanitiseMessage.ts",
      "src/event-handler/handlers/storeEvent.ts",
      "src/incoming-message-handler/handlers/recordSentToBichardEvent.ts",
      "src/incoming-message-handler/handlers/sendToBichard.ts",
      "src/incoming-message-handler/handlers/storeMessage.ts",
      "src/message-receiver/index.ts",
      "src/retry-failed-messages/index.ts",
      "src/sanitise-old-messages/index.ts",
      "src/transfer-messages/index.ts"
    ],
    bundle: true,
    logLevel: "info",
    outdir: "build",
    minify: true,
    target: "node16",
    platform: "node",
    external: ["pg-native"]
  })
  .catch(() => process.exit(1))
