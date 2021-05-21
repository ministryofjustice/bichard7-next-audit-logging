deploy-incoming-message-handler:
	cd ./incoming-message-handler && npm run setup:env && cd -

deploy-general-event-handler:
	cd ./general-event-handler && npm run setup:env && cd -

prepare-e2e:
	./environment/prepare-e2e.sh

.PHONY: run-api
run-api:
	cd ./audit-log-api && npm run start && cd -

.PHONY: run-portal
run-portal:
	cd ./audit-log-api && npm run start && cd -

.PHONY: run-all
run-all: run-api deploy-incoming-message-handler deploy-general-event-handler run-portal

.PHONY: run-all-e2e
run-all-e2e: prepare-e2e run-api deploy-incoming-message-handler deploy-general-event-handler

.PHONY: destroy
destroy:
	docker-compose -f ./environment/docker-compose.yml down
