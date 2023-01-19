SHELL := /bin/bash


.PHONY: validate
validate:
	npm i && NODE_OPTIONS=--max_old_space_size=4096 npm run lint

########################################
# Run Commands
########################################

.PHONY: run-mq
run-mq:
	@( \
		if [ "${SKIP_MQ}" != "true" ]; then \
			docker-compose -f environment/docker-compose.yml up -d mq; \
		fi; \
  )

.PHONY: stop-mq
stop-mq:
	docker-compose -f environment/docker-compose.yml stop mq

.PHONY: run-pg
run-pg:
	@( \
		if [ "${SKIP_PG}" != "true" ]; then \
			docker-compose -f environment/docker-compose.yml up -d pg; \
		fi; \
  )

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
