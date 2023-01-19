#!/bin/bash

command='wget --no-check-certificate -q http://localhost:3010/messages -O /dev/null';
server_started_status_code=0;
status=-1;
to_wait=${1:-90};
echo "Waiting for ${to_wait} seconds"

until [[ $status == $server_started_status_code || $to_wait -le 0 ]]
do
  sleep 1;
  printf "*"
  eval $command;
  status=$?
  to_wait=$((to_wait-1))
done

if (( $status != $server_started_status_code )); then
  printf "Audit Log API has not started"
  exit 1;
fi
