SHELL := /bin/bash


.PHONY: validate
validate:
	npm i && NODE_OPTIONS=--max_old_space_size=4096 npm run lint

.PHONY: audit-fix
audit-fix:
	scripts/audit-fix-all.sh


########################################
# Run Commands
########################################

.PHONY: run-api
run-api:
	cd src/audit-log-api && npm run start

.PHONY: run-portal
run-portal:
	cd src/audit-log-portal && npm run start

.PHONY: run-infra
run-infra: run-all-without-portal run-portal

.PHONY: run-all
run-all: run-api run-portal

.PHONY: run-all-e2e
run-all-e2e:
	./scripts/run-all-e2e.sh

.PHONY: run-mq
run-mq:
	docker-compose -f environment/docker-compose.yml up -d mq

.PHONY: stop-mq
stop-mq:
	docker-compose -f environment/docker-compose.yml stop mq

.PHONY: run-pg
run-pg:
	docker-compose -f environment/docker-compose.yml up -d pg

.PHONY: stop-pg
stop-pg:
	docker-compose -f environment/docker-compose.yml stop pg


########################################
# Destroy Commands
########################################

.PHONY: destroy-infra
destroy-infra:
	docker-compose -f ./environment/docker-compose.yml down

.PHONY: destroy
destroy: destroy-infra

########################################
# Action Commands
########################################

.PHONY: build-portal-image
build-portal-image:
	AWS_ACCOUNT_ID=258361008057 AWS_REGION=eu-west-2 scripts/build-portal-docker-image.sh

.PHONY: codebuild-portal-image
codebuild-portal-image:
	scripts/build-portal-codebuild-image.sh

.PHONY: send-message
send-message:
	cd incoming-message-handler && scripts/trigger-state-machine.sh

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

.PHONY: send-hearing-outcome-input-failure-event
send-hearing-outcome-input-failure-event:
	scripts/send-event.sh "hearing-outcome-input" "SEND_HEARING_OUTCOME_INPUT_QUEUE.FAILURE"

.PHONY: send-pnc-update-request-failure-event
send-pnc-update-request-failure-event:
	scripts/send-event.sh "pnc-update-request" "PNC_UPDATE_REQUEST_QUEUE.FAILURE"

########################################
# AWS - Action Commands
########################################

.PHONY: upload-message-to-s3
upload-message-to-s3:
	incoming-message-handler/scripts/upload-message-to-s3.sh

.PHONY: run-transfer-messages
run-transfer-messages:
	scripts/transfer-messages.sh

.PHONY: retry-execution
retry-execution:
	scripts/retry-execution.sh "${EXECUTION_ID}"
