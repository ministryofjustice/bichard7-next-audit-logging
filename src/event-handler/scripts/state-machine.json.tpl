{
  "Comment": "Manages the workflow for processing events from the Bichard system",
  "StartAt": "Store Event",
  "States": {
    "Store Event": {
      "Type": "Task",
      "Resource": "${STORE_EVENT_LAMBDA_ARN}",
      "End": true
    }
  }
}
