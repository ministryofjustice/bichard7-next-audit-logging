# This script is for preparing the environment for solution-level end-to-end testing.
# You do not need to run this script if you are running a component-level end-to-end test.

# Set MQ_HOST environment variable based on the current OS
if [ "$(uname)" == "Darwin" ]; then
  MQ_HOST=host.docker.internal:61613
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  MQ_HOST=172.17.0.1:61613
fi

MQ_AUDIT_EVENT_QUEUE=AUDIT_EVENT_QUEUE

export MQ_HOST
export MQ_AUDIT_EVENT_QUEUE
