.PHONY: deploy-incoming-message-handler
deploy-incoming-message-handler:
	cd ./incoming-message-handler && npm run setup:env && cd -

.PHONY: deploy-general-event-handler
deploy-general-event-handler:
	cd ./general-event-handler && npm run setup:env && cd -

.PHONY: run-api
run-api:
	cd ./audit-log-api && npm run start && cd -

.PHONY: run-portal
run-portal:
	cd ./audit-log-api && npm run start && cd -

.PHONY: run-all
run-all: run-api deploy-incoming-message-handler deploy-general-event-handler run-portal

.PHONY: run-all-e2e
run-all-e2e: 
	./scripts/run-all-e2e.sh

.PHONY: destroy
destroy:
	docker-compose -f ./environment/docker-compose.yml down
