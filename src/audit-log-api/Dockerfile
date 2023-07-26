ARG BUILD_IMAGE="nodejs"
FROM ${BUILD_IMAGE}

WORKDIR /server

COPY ./package.json ./
COPY ./package-lock.json ./
COPY ./tsconfig.json ./
RUN npm ci --include=dev

COPY ./src ./src

CMD [ "npx", "ts-node", "--script-mode", "-T", "/server/src/audit-log-api/test-server.ts" ]
