# This script is for preparing the environment and running all components required for solution-level end-to-end testing.

# Set MQ_HOST environment variable based on the current OS
if [ "$(uname)" == "Darwin" ]; then
  MQ_HOST=host.docker.internal:61613
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  MQ_HOST=172.17.0.1:61613
fi

MQ_INCOMING_MESSAGE_HANDLER_QUEUE=COURT_RESULT_INPUT_QUEUE

export MQ_HOST
export MQ_INCOMING_MESSAGE_HANDLER_QUEUE

make run-all-without-portal
