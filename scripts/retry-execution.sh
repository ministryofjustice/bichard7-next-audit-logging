#!/bin/bash

FAILED_STATUS="ExecutionFailed"
NOT_FOUND_STATUS="NOT_FOUND"

function get_attempt_number {
  local arn=$1
  local attempt=$(echo ${arn} | perl -lne 'print $1 if /^.*-R(\d{2})$/')

  echo $attempt
}

function get_next_execution_arn {
  local arn=$1
  local attempt=$(get_attempt_number ${arn})
  if [[ -z "${attempt}" ]]
  then
    local state_machine_arn_part=$(echo ${arn} | perl -lne 'print $1 if /^(.*):.*$/')
    local execution_name_part=$(echo ${arn} | perl -lne 'print $1 if /^.*:(.*)$/')

    # State machine execution name has 80 characters limit
    echo "${state_machine_arn_part}:${execution_name_part:0:76}-R01"
    return
  fi

  local next_attempt=$(perl -e "print sprintf(\"%02d\", \"${attempt}\" + 1)")

  local arn_without_attempt_number=$(echo ${arn} | perl -lne 'print $1 if /^(.*-R)\d{2}$/')
  echo "${arn_without_attempt_number}${next_attempt}"
}

function get_execution_name {
  local arn=$1
  local execution_name=$(echo ${arn} | perl -lne 'print $1 if /^.*:(.*)$/')

  echo $execution_name
}

function load_execution_details {
  local arn=$1
  local execution_history=$(aws stepfunctions get-execution-history --reverse-order --execution-arn ${arn})
  local execution_status=$(echo "${execution_history}" | jq -r '.events[0] | .type')
  local execution_payload=$(echo "${execution_history}" | \
    jq -r '.events[] | select(.type | contains("ExecutionStarted")) | .executionStartedEventDetails.input')

  if ! [[ -z $execution_payload ]]
  then
    LAST_EXECUTION_PAYLOAD=$execution_payload
  fi

  echo "$CURRENT_EXECUTION_PAYLOAD"
  CURRENT_STATE_MACHINE_ARN=$(echo ${arn} | perl -lne 'print $1 if /^(.*):.*$/')
  CURRENT_STATE_MACHINE_ARN="${CURRENT_STATE_MACHINE_ARN//:execution:/:stateMachine:}"

  if [[ -z "${execution_status}" ]]
  then
    CURRENT_EXECUTION_STATUS="${NOT_FOUND_STATUS}"
  else
    CURRENT_EXECUTION_STATUS="${execution_status}"
  fi
}

function retry_execution {
  local arn=$1
  local execution_arn=$arn
  load_execution_details ${execution_arn} > /dev/null

  echo "Checking if execution exists and can be retried..."

  if [[ "${CURRENT_EXECUTION_STATUS}" == "${NOT_FOUND_STATUS}" ]]
  then
    echo "Execution ARN not found: ${execution_arn}"
    return
  fi

  if [[ "${CURRENT_EXECUTION_STATUS}" != "${FAILED_STATUS}" ]]
  then
    echo "Execution status is ${CURRENT_EXECUTION_STATUS} and cannot be retried"
    return
  fi

  while true
  do
    echo "Checking execution history for the next attempt..."
    execution_arn=$(get_next_execution_arn ${execution_arn})
    attempt=$(get_attempt_number ${execution_arn})
    load_execution_details ${execution_arn} > /dev/null

    echo "Checking if execution exists and can be retried... (Attempt ${attempt})"

    if [[ "${CURRENT_EXECUTION_STATUS}" == "${NOT_FOUND_STATUS}" ]]
    then
      local next_execution_name=$(get_execution_name ${execution_arn})
      echo "Retrying execution... (Attemp ${attempt})"
      echo "New execution ARN: ${execution_arn}"
      echo "New execution name: ${next_execution_name}"
      echo "State machine ARN: ${CURRENT_STATE_MACHINE_ARN}"

      aws stepfunctions start-execution \
        --state-machine-arn ${CURRENT_STATE_MACHINE_ARN} \
        --name "${next_execution_name}" \
        --input "${LAST_EXECUTION_PAYLOAD}"
      return
    fi

    if [[ "${CURRENT_EXECUTION_STATUS}" != "${FAILED_STATUS}" ]]
    then
      echo "Execution status is ${CURRENT_EXECUTION_STATUS} and cannot be retried."
      echo "Execution arn: ${execution_arn}"
      return
    fi

    echo "Attempt ${new_attempt} has failed status"
  done
}

if ! [[ -z $1 ]]
then
  retry_execution $1
fi
