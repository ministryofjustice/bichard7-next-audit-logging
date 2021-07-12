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
	npm i && npm run lint

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

.PHONY: run-infra
run-all: run-all-without-portal run-portal

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

.PHONY: destroy-all
destroy-all: destroy-mq-listener destroy-infra

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
