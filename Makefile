SHELL := /bin/bash

########################################
# Install, Build, Test Commands
########################################

.PHONY: install
install:
	scripts/install-all.sh

.PHONY: build-all
build-all:
	scripts/build-all.sh

.PHONY: test
test:
	scripts/test-all.sh

.PHONY: validate
validate:
	npm i && NODE_OPTIONS=--max_old_space_size=4096 npm run lint

########################################
# Build Commands
########################################

# Package => build output aliases
shared-types: shared-types/dist
shared-testing: shared-testing/dist
shared: shared/dist
retrieve-event-from-s3: src/lambdas/retrieve-event-from-s3/build
translate-event: src/lambdas/translate-event/build
record-event: src/lambdas/record-event/build
message-receiver: src/lambdas/message-receiver/build
transfer-messages: src/lambdas/transfer-messages/build
incoming-message-handler: incoming-message-handler/build
audit-log-api: audit-log-api/build
audit-log-portal: audit-log-portal/.next

define get_source_files
	$(shell find $(1) \
		\( \
			-name .next -o \
			-name build -o \
			-name dist -o \
			-name documentation -o \
			-name node_modules \
		\) -prune -o \
		-type f \( \
			-iname '*.js' -o \
			-iname '*.json' -o \
			-iname '*.jsx' -o \
			-iname '*.sh' -o \
			-iname '*.snap' -o \
			-iname '*.ts' -o \
			-iname '*.tsx'
		\) -print \
	)
endef

# Source files for each package
SHARED_TYPES_SOURCE := $(call get_source_files,shared-types)
SHARED_TESTING_SOURCE := $(call get_source_files,shared-testing)
SHARED_SOURCE := $(call get_source_files,shared)
RETRIEVE_EVENT_FROM_S3_SOURCE := $(call get_source_files,src/lambdas/retrieve-event-from-s3)
TRANSLATE_EVENT_SOURCE := $(call get_source_files,src/lambdas/translate-event)
RECORD_EVENT_SOURCE := $(call get_source_files,src/lambdas/record-event)
MESSAGE_RECEIVER_SOURCE := $(call get_source_files,src/lambdas/message-receiver)
TRANSFER_MESSAGES_SOURCE := $(call get_source_files,src/lambdas/transfer-messages)
INCOMING_MESSAGE_HANDLER_SOURCE := $(call get_source_files,incoming-message-handler)
AUDIT_LOG_API_SOURCE := $(call get_source_files,audit-log-api)
AUDIT_LOG_PORTAL_SOURCE := $(call get_source_files,audit-log-portal)

# How to build each package
shared-types/dist: $(SHARED_TYPES_SOURCE)
	cd shared-types && npm run build

shared-testing/dist: shared-types/dist $(SHARED_TESTING_SOURCE)
	cd shared-testing && npm run build

shared/dist: shared-types/dist shared-testing/dist $(SHARED_SOURCE)
	cd shared && npm run build

src/lambdas/retrieve-event-from-s3/build: shared-types/dist shared-testing/dist shared/dist $(RETRIEVE_EVENT_FROM_S3_SOURCE)
	cd src/lambdas/retrieve-event-from-s3 && npm run build

src/lambdas/translate-event/build: shared-types/dist shared-testing/dist shared/dist $(TRANSLATE_EVENT_SOURCE)
	cd src/lambdas/translate-event && npm run build

src/lambdas/record-event/build: shared-types/dist shared-testing/dist shared/dist $(RECORD_EVENT_SOURCE)
	cd src/lambdas/record-event && npm run build

src/lambdas/message-receiver/build: shared-types/dist shared-testing/dist shared/dist $(MESSAGE_RECEIVER_SOURCE)
	cd src/lambdas/message-receiver && npm run build

src/lambdas/transfer-messages/build: shared-types/dist shared-testing/dist shared/dist $(TRANSFER_MESSAGES_SOURCE)
	cd src/lambdas/transfer-messages && npm run build

.PHONY: event-handler
event-handler: shared-types/dist shared-testing/dist shared/dist

incoming-message-handler/build: shared-types/dist shared-testing/dist shared/dist $(INCOMING_MESSAGE_HANDLER_SOURCE)
	cd incoming-message-handler && npm run build

audit-log-api/build: shared-types/dist shared-testing/dist shared/dist $(AUDIT_LOG_API_SOURCE)
	cd audit-log-api && npm run build

audit-log-portal/.next: shared-types/dist shared/dist $(AUDIT_LOG_PORTAL_SOURCE)
	cd audit-log-portal && npm run build

# Clean
.PHONY: clean
clean:
	rm -rf \
		shared-types/dist \
		shared-testing/dist \
		shared/dist \
		src/lambdas/retrieve-event-from-s3/build \
		src/lambdas/translate-event/build \
		src/lambdas/record-event/build \
		src/lambdas/message-receiver/build \
		src/lambdas/transfer-messages/build \
		incoming-message-handler/build \
		audit-log-api/build \
		audit-log-portal/.next

########################################
# Run Commands
########################################

.PHONY: run-mq-listener
run-mq-listener: destroy-mq-listener
	cd mq-listener && npm run start

.PHONY: run-incoming-message-handler
run-incoming-message-handler:
	cd incoming-message-handler && npm run setup:env

.PHONY: run-api
run-api:
	cd audit-log-api && npm run start:daemon

.PHONY: run-portal
run-portal:
	cd audit-log-portal && npm run start

.PHONY: run-event-handler
run-event-handler:
	cd src/event-handler && npm run setup:env

.PHONY: run-all-without-portal
run-all-without-portal: run-api run-incoming-message-handler run-event-handler

.PHONY: run-infra
run-infra: run-all-without-portal run-portal

.PHONY: run-all
run-all: run-all-without-portal run-portal run-mq-listener

.PHONY: run-all-e2e
run-all-e2e:
	./scripts/run-all-e2e.sh

.PHONY: run-mq
run-mq:
	docker-compose -f environment/docker-compose.yml up -d mq

.PHONY: stop-mq
stop-mq:
	docker-compose -f environment/docker-compose.yml stop mq

########################################
# Destroy Commands
########################################

.PHONY: destroy-mq-listener
destroy-mq-listener:
	cd mq-listener && npm run stop

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
	cd mq-listener && npm run logs

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
