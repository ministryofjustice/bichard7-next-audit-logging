{
  "Comment": "Manages the workflow for processing events from the Bichard system",
  "StartAt": "Iterate Messages",
  "States": {
    "Iterate Messages": {
      "Type": "Map",
      "ItemsPath": "$.messages",
      "Iterator": {
        "StartAt": "Store in S3",
        "States": {
          "Store in S3": {
            "Type": "Task",
            "Resource": "${STORE_IN_S3_LAMBDA_ARN}",
            "Next": "Translate Event"
          },
          "Translate Event": {
            "Type": "Task",
            "Resource": "${TRANSLATE_EVENT_LAMBDA_ARN}",
            "Next": "Record Event"
          },
          "Record Event": {
            "Type": "Task",
            "Resource": "${RECORD_EVENT_LAMBDA_ARN}",
            "End": true
          }
        }
      },
      "End": true
    }
  }
}
