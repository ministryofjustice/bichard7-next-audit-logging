{
  "Comment": "Simulates a state machine to manage the workflow of receiving Libra/ExISS messages into the system",
  "StartAt": "Store Message",
  "States": {
    "Store Message": {
      "Type": "Task",
      "Resource": "${STORE_MESSAGE_LAMBDA_ARN}",
      "Next": "Validate Store Message result",
      "Retry": [{
         "ErrorEquals": ["States.ALL"],
         "IntervalSeconds": 180,
         "MaxAttempts": 99999999,
         "BackoffRate": 1.1
      }]
    },
    "Validate Store Message result": {
      "Type": "Choice",
      "Choices": [
        {
          "And": [
            {
              "Variable": "$.s3ValidationResult",
              "IsPresent": true
            },
            {
              "Variable": "$.s3ValidationResult.isValid",
              "BooleanEquals": false
            }
          ],
          "Next": "Invalid S3 Key"
        },
        {
          "And": [
            {
              "Variable": "$.messageHashValidationResult",
              "IsPresent": true
            },
            {
              "Variable": "$.messageHashValidationResult.isValid",
              "BooleanEquals": false
            }
          ],
          "Next": "Duplicate message"
        },
        {
          "And": [
            {
              "Variable": "$.s3ValidationResult",
              "IsPresent": false
            },
            {
              "Variable": "$.messageHashValidationResult",
              "IsPresent": false
            }
          ],
          "Next": "Send to Bichard"
        }
      ]
    },
    "Invalid S3 Key": {
      "Type": "Pass",
      "End": true
    },
    "Duplicate message": {
      "Type": "Fail",
      "Cause": "Duplicate message hash",
      "Error": "$.messageHashValidationResult.message"
    },
    "Send to Bichard": {
      "Type": "Task",
      "Resource": "${SEND_TO_BICHARD_ARN}",
      "Next": "Record Sent to Bichard Event",
      "Retry": [{
         "ErrorEquals": ["States.ALL"],
         "IntervalSeconds": 180,
         "MaxAttempts": 99999999,
         "BackoffRate": 1.1
      }]
    },
    "Record Sent to Bichard Event": {
      "Type": "Task",
      "Resource": "${RECORD_SENT_TO_BICHARD_EVENT_ARN}",
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
