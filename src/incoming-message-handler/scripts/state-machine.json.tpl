{
  "Comment": "Simulates a state machine to manage the workflow of receiving Libra/ExISS messages into the system",
  "StartAt": "Store Message",
  "States": {
    "Store Message": {
      "Type": "Task",
      "Resource": "${STORE_MESSAGE_LAMBDA_ARN}",
      "Next": "Validate Store Message result"
    },
    "Validate Store Message result": {
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
          "Next": "Send to Bichard"
        }
      ]
    },
    "Invalid S3 Key": {
      "Type": "Pass",
      "End": true
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
