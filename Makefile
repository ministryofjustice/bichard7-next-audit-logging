SHELL := /bin/bash

########################################
# Run Commands
########################################

.PHONY: run-incoming-message-handler
run-incoming-message-handler:
	cd ./incoming-message-handler && \
		npm run setup:env && \
		cd -

.PHONY: run-general-event-handler
run-general-event-handler:
	cd ./general-event-handler && \
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

.PHONY: run-all-without-portal
run-all-without-portal: run-api run-incoming-message-handler run-general-event-handler

.PHONY: run-all
run-all: run-all-without-portal run-portal

.PHONY: run-all-e2e
run-all-e2e: 
	./scripts/run-all-e2e.sh

########################################
# Destroy Commands
########################################

.PHONY: destroy-all
destroy-all:
	docker-compose -f ./environment/docker-compose.yml down

########################################
# Action Commands
########################################

.PHONY: build-portal-image
build-portal-image:
	docker build -t audit-log-portal . \
		--build-arg aws_account_id=258361008057 \
		--build-arg image_id=025d33d7797aaad52c0e3c96699814946093d4b50f792ec35cbd2f57278b94f2

.PHONY: get-api-url
get-api-url:
	\. environment/audit-log-api-url.sh && get_audit_log_api_url

.PHONY: follow-logs
follow-logs:
	docker logs -tf localstack_main

.PHONY: scan-db
scan-db:
	awslocal dynamodb scan --table-name audit-log

.PHONY: send-message
send-message:
	cd incoming-message-handler && \
		scripts/trigger-state-machine.sh && \
		cd -
