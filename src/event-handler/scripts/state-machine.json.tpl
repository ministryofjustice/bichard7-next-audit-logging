{
  "Comment": "Manages the workflow for processing events from the Bichard system",
  "StartAt": "Store Event",
  "States": {
    "Store Event": {
      "Type": "Task",
      "Resource": "${STORE_EVENT_LAMBDA_ARN}",
      "End": true,
      "Retry": [{
         "ErrorEquals": ["States.ALL"],
         "IntervalSeconds": 180,
         "MaxAttempts": 99999999,
         "BackoffRate": 1.1
      }]
    }
  }
}
