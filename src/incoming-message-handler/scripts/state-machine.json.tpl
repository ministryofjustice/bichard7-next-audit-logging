{
  "Comment": "Simulates a state machine to manage the workflow of receiving Libra/ExISS messages into the system",
  "StartAt": "Retrieve from S3",
  "States": {
    "Retrieve from S3": {
      "Type": "Task",
      "Resource": "${RETRIEVE_FROM_S3_LAMBDA_ARN}",
      "Next": "Validate retrieve from S3 result"
    },
    "Validate retrieve from S3 result": {
      "Type": "Choice",
      "Choices": [
        {
          "And": [
            {
              "Variable": "$.validationResult",
              "IsPresent": true
            },
            {
              "Variable": "$.validationResult.isValid",
              "BooleanEquals": false
            }
          ],
          "Next": "Invalid S3 Key"
        },
        {
          "Variable": "$.validationResult",
          "IsPresent": false,
          "Next": "Format Message"
        }
      ]
    },
    "Invalid S3 Key": {
      "Type": "Pass",
      "End": true
    },
    "Format Message": {
      "Type": "Task",
      "Resource": "${FORMAT_MESSAGE_LAMBDA_ARN}",
      "Next": "Parse Message"
    },
    "Parse Message": {
      "Type": "Task",
      "Resource": "${PARSE_MESSAGE_LAMBDA_ARN}",
      "Next": "Log Message Receipt"
    },
    "Log Message Receipt": {
      "Type": "Task",
      "Resource": "${LOG_MESSAGE_RECEIPT_LAMBDA_ARN}",
      "Next": "Send to Bichard"
    },
    "Send to Bichard": {
      "Type": "Task",
      "Resource": "${SEND_TO_BICHARD_ARN}",
      "Next": "Record Sent to Bichard Event"
    },
    "Record Sent to Bichard Event": {
      "Type": "Task",
      "Resource": "${RECORD_SENT_TO_BICHARD_EVENT_ARN}",
      "End": true
    }
  }
}