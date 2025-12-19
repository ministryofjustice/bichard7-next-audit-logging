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

# https://github.com/99x/serverless-dynamodb-local/pull/298
.PHONY: fix-serverless-dynamodb-local
fix-serverless-dynamodb-local:
	cd ./node_modules/serverless-dynamodb-local && \
	npx -y replace-in-file@8.2.0 "MOCK_ACCESS_KEY_ID" "MOCKACCESSKEYID" index.js && \
	npx -y replace-in-file@8.2.0 "MOCK_SECRET_ACCESS_KEY" "MOCKSECRETACCESSKEY" index.js

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

.PHONY: build-api-server
build-api-server:
	docker build -f src/audit-log-api/Dockerfile -t audit-log-api .

.PHONY: build-event-handler-server
build-event-handler-server:
	docker build -f src/event-handler/Dockerfile -t event-handler .
