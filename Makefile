SHELL := /bin/bash

########################################
# Install, Build, Test Commands
########################################

.PHONY: build
build:
	scripts/install-all.sh && scripts/build-all.sh

.PHONY: test
test:
	scripts/test-all.sh

.PHONY: validate
validate:
	npm i && NODE_OPTIONS=--max_old_space_size=4096 npm run lint

########################################
# Run Commands
########################################

.PHONY: run-mq-listener
run-mq-listener: destroy-mq-listener
	cd ./mq-listener && npm run start && cd -

.PHONY: run-incoming-message-handler
run-incoming-message-handler:
	cd ./incoming-message-handler && \
		npm run setup:env && \
		cd -

.PHONY: run-api
run-api:
	cd ./audit-log-api && \
		npm run start && \
		cd -

.PHONY: run-portal
run-portal:
	cd ./audit-log-portal && \
		npm run start && \
		cd -

.PHONY: run-event-handler
run-event-handler:
	cd ./src/event-handler && \
		npm run setup:env && \
		cd -

.PHONY: run-all-without-portal
run-all-without-portal: run-api run-incoming-message-handler run-event-handler

.PHONY: run-infra
run-infra: run-all-without-portal run-portal

.PHONY: run-all
run-all: run-all-without-portal run-portal run-mq-listener

.PHONY: run-all-e2e
run-all-e2e: 
	./scripts/run-all-e2e.sh

########################################
# Destroy Commands
########################################

.PHONY: destroy-mq-listener
destroy-mq-listener:
	cd ./mq-listener && npm run stop && cd -

.PHONY: destroy-infra
destroy-infra:
	docker-compose -f ./environment/docker-compose.yml down

.PHONY: destroy
destroy: destroy-mq-listener destroy-infra

########################################
# Action Commands
########################################

.PHONY: build-portal-image
build-portal-image:
	AWS_ACCOUNT_ID=258361008057 AWS_REGION=eu-west-2 scripts/build-portal-docker-image.sh

.PHONY: codebuild-portal-image
codebuild-portal-image:
	scripts/build-portal-codebuild-image.sh

.PHONY: get-api-url
get-api-url:
	\. environment/audit-log-api-url.sh && get_audit_log_api_url

.PHONY: follow-logs
follow-logs:
	docker logs -tf localstack_main

.PHONY: follow-mq-listener-logs
follow-mq-listener-logs:
	cd ./mq-listener && npm run logs && cd -

.PHONY: scan-db
scan-db:
	awslocal dynamodb scan --table-name audit-log

.PHONY: send-message
send-message:
	cd incoming-message-handler && \
		scripts/trigger-state-machine.sh && \
		cd -

.PHONY: send-court-result-input-failure-event
send-court-result-input-failure-event:
	scripts/send-event.sh "court-result-input" "COURT_RESULT_INPUT.FAILURE"

.PHONY: send-hearing-outcome-pnc-update-failure-event
send-hearing-outcome-pnc-update-failure-event:
	scripts/send-event.sh "hearing-outcome-pnc-update" "HEARING_OUTCOME_PNC_UPDATE.FAILURE"

.PHONY: send-pnc-response-received
send-pnc-response-received:
	scripts/send-event.sh "pnc-response-received" "GENERAL_EVENT_QUEUE"

.PHONY: send-data-set-pnc-update-failure-event
send-data-set-pnc-update-failure-event:
	scripts/send-event.sh "data-set-pnc-update" "DATA_SET_PNC_UPDATE_QUEUE.FAILURE"

.PHONY: send-pnc-update-request-failure-event
send-pnc-update-request-failure-event:
	scripts/send-event.sh "pnc-update-request" "PNC_UPDATE_REQUEST_QUEUE.FAILURE"

########################################
# AWS - Action Commands
########################################

.PHONY: upload-message-to-s3
upload-message-to-s3:
	incoming-message-handler/scripts/upload-message-to-s3.sh
