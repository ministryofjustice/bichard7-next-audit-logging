# AWS Lambda: Incoming Message Handler

This is an AWS Lambda function that has the responsibility to accept incoming messages from the ExISS API that sits between the Libra court system and Bichard7. The intention is that this allows us to log the message along with some contextual information, for later analysis and review by users in a separate part of the system. This lambda will then also reformat the message before sending it back into the rest of the Bichard7.
