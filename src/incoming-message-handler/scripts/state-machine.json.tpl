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
              "Variable": "$.validationResult",
              "IsPresent": true
            },
            {
              "Variable": "$.validationResult.isValid",
              "BooleanEquals": false
            }
          ],
          "Next": "Delete invalid message from S3"
        },
        {
          "Variable": "$.validationResult",
          "IsPresent": false,
          "Next": "Send to Bichard"
        }
      ]
    },
    "Delete invalid message from S3": {
      "Type": "Task",
      "End": true,
      "Parameters": {
        "Bucket.$": "$.bucketName",
        "Key.$": "$.s3Path"
      },
      "Resource": "arn:aws:states:::aws-sdk:s3:deleteObject",
      "Retry": [{
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 180,
        "MaxAttempts": 99999999,
        "BackoffRate": 1.1
      }]
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
