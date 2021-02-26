#!/bin/bash

sam local invoke IncomingMessageHandler -d 9999 -e event.json &

sleep 5
