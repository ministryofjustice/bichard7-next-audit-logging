import { DynamoDB } from "@aws-sdk/client-dynamodb";

const client = new DynamoDB({ region: "eu-west-2", endpoint: "https://dynamodb.eu-west-2.amazonaws.com" });

const params = {
   Key : {"statusIndex" : { "S" : "Processing" },

     "receivedDate": {"S": "2022-10-19T14:00:00"}
   }
}

//const command = new BatchGetItemCommand(params);

//client.getItem(params).then((data) => console.log(data)).catch((e) => console.error(e))

var params = {
  ExpressionAttributeValues: {
    ':s': {N: '2'},
    ':e' : {N: '09'},
    ':topic' : {S: 'PHRASE'}
  },
  KeyConditionExpression: 'Season = :s and Episode > :e',
  TableName:  "bichard-7-production-audit-log",
};

client.query(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    //console.log("Success", data.Items);
    data.Items.forEach(function(element, index, array) {
      console.log(element.Title.S + " (" + element.Subtitle.S + ")");
    });
  }
});
