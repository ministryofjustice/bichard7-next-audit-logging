{
  "Comment": "Manages the workflow for processing events from the Bichard system",
  "StartAt": "Retrieve Event from S3",
  "States": {
    "Retrieve Event from S3": {
      "Type": "Task",
      "Resource": "${RETRIEVE_EVENT_FROM_S3_LAMBDA_ARN}",
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
}
