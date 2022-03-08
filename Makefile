SHELL := /bin/bash

########################################
# Install, Build, Test Commands
########################################

.PHONY: install
install:
	scripts/install-all.sh

.PHONY: build
build:
	make -j 4 build-all

.PHONY: build-all
build-all: shared-types shared-testing shared \
	   message-receiver transfer-messages incoming-message-handler event-handler \
	   audit-log-api audit-log-portal archive-user-logs retry-failed-messages \
		 record-error-archival

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
shared-types: src/shared-types/build
shared-testing: src/shared-testing/build
shared: src/shared/build
message-receiver: src/message-receiver/build
transfer-messages: src/transfer-messages/build
incoming-message-handler: src/incoming-message-handler/build
event-handler: src/event-handler/build
audit-log-api: src/audit-log-api/build
audit-log-portal: src/audit-log-portal/build
archive-user-logs: src/archive-user-logs/build
retry-failed-messages: src/retry-failed-messages/build
record-error-archival: src/record-error-archival/build

define get_source_files
	$(shell find $(1) \
		\( \
			-name build -o \
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
SHARED_TYPES_SOURCE := $(call get_source_files,src/shared-types)
SHARED_TESTING_SOURCE := $(call get_source_files,src/shared-testing)
SHARED_SOURCE := $(call get_source_files,src/shared)
MESSAGE_RECEIVER_SOURCE := $(call get_source_files,src/message-receiver)
TRANSFER_MESSAGES_SOURCE := $(call get_source_files,src/transfer-messages)
INCOMING_MESSAGE_HANDLER_SOURCE := $(call get_source_files,src/incoming-message-handler)
EVENT_HANDLER_SOURCE := $(call get_source_files,src/event-handler)
AUDIT_LOG_API_SOURCE := $(call get_source_files,src/audit-log-api)
AUDIT_LOG_PORTAL_SOURCE := $(call get_source_files,src/audit-log-portal)
ARCHIVE_USER_LOGS := $(call get_source_files,src/archive-user-logs)
RETRY_FAILED_MESSAGES_SOURCE := $(call get_source_files,src/retry-failed-messages)
RECORD_MESSAGE_ARCHIVAL_SOURCE := $(call get_source_files,src/record-error-archival)

# How to build each package
src/shared-types/build: $(SHARED_TYPES_SOURCE)
	cd src/shared-types && npm run build

src/shared-testing/build: src/shared-types/build $(SHARED_TESTING_SOURCE)
	cd src/shared-testing && npm run build

src/shared/build: src/shared-types/build src/shared-testing/build $(SHARED_SOURCE)
	cd src/shared && npm run build

src/message-receiver/build: src/shared-types/build src/shared-testing/build src/shared/build $(MESSAGE_RECEIVER_SOURCE)
	cd src/message-receiver && npm run build

src/transfer-messages/build: src/shared-types/build src/shared-testing/build src/shared/build $(TRANSFER_MESSAGES_SOURCE)
	cd src/transfer-messages && npm run build

src/event-handler/build: src/shared-types/build src/shared-testing/build src/shared/build src/message-receiver/build $(EVENT_HANDLER_SOURCE)
	cd src/event-handler && npm run build

.PHONY: src/event-handler
src/event-handler: src/shared-types/build src/shared-testing/build src/shared/build src/message-receiver/build

src/incoming-message-handler/build: src/shared-types/build src/shared-testing/build src/shared/build $(INCOMING_MESSAGE_HANDLER_SOURCE)
	cd src/incoming-message-handler && npm run build

src/audit-log-api/build: src/shared-types/build src/shared-testing/build src/shared/build $(AUDIT_LOG_API_SOURCE)
	cd src/audit-log-api && npm run build

src/audit-log-portal/build: src/shared-types/build src/shared/build $(AUDIT_LOG_PORTAL_SOURCE)
	cd src/audit-log-portal && npm run build

src/archive-user-logs/build: src/shared-types/build src/shared-testing/build src/shared/build $(ARCHIVE_USER_LOGS)
	cd src/archive-user-logs && npm run build

src/retry-failed-messages/build: src/shared-types/build src/shared/build $(RETRY_FAILED_MESSAGES_SOURCE)
	cd src/retry-failed-messages && npm run build

src/record-error-archival/build: src/record-error-archival/build src/shared/build $(RECORD_MESSAGE_ARCHIVAL_SOURCE)
	cd src/record-error-archival && npm run build

# Clean
.PHONY: clean
clean:
	rm -rf src/*/build src/lambda/*/build

########################################
# Run Commands
########################################

.PHONY: run-incoming-message-handler
run-incoming-message-handler:
	cd src/incoming-message-handler && npm run setup:env

.PHONY: run-api
run-api:
	cd src/audit-log-api && npm run start

.PHONY: run-portal
run-portal:
	cd src/audit-log-portal && npm run start

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
