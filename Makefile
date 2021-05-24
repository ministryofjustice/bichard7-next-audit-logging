.PHONY: run-incoming-message-handler
run-incoming-message-handler:
	cd ./incoming-message-handler && npm run setup:env && cd -

.PHONY: run-general-event-handler
run-general-event-handler:
	cd ./general-event-handler && npm run start && cd -

.PHONY: run-api
run-api:
	cd ./audit-log-api && npm run start && cd -

.PHONY: run-portal
run-portal:
	cd ./audit-log-portal && npm run start && cd -

.PHONY: run-all
run-all: run-api run-incoming-message-handler run-general-event-handler run-portal

.PHONY: run-all-e2e
run-all-e2e: 
	./scripts/run-all-e2e.sh

.PHONY: destroy-all
destroy-all:
	docker-compose -f ./environment/docker-compose.yml down
