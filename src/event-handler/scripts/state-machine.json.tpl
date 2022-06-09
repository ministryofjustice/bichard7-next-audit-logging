{
  "Comment": "Manages the workflow for processing events from the Bichard system",
  "StartAt": "Store Event",
  "States": {
    "Store Event": {
      "Type": "Task",
      "Resource": "${STORE_EVENT_LAMBDA_ARN}",
      "Retry": [{
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 180,
        "MaxAttempts": 99999999,
        "BackoffRate": 1.1
      }],
      "Next": "Validate Store Event result"
    },
    "Validate Store Event result": {
      "Type": "Choice",
      "Choices": [
        {
          "And": [
            {
              "Variable": "$.validationResult",
              "IsPresent": true
            },
            {
              "Variable": "$.validationResult.s3ObjectNotFound",
              "BooleanEquals": true
            }
          ],
          "Next": "S3 object not found"
        },
        {
          "Variable": "$.validationResult",
          "IsPresent": false,
          "Next": "Delete from S3"
        }
      ]
    },
    "S3 object not found": {
      "Type": "Pass",
      "End": true
    },
    "Delete from S3": {
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
    }
  }
}
