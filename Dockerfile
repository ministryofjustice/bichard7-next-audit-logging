ARG NODE_IMAGE=258361008057.dkr.ecr.eu-west-2.amazonaws.com/nodejs:b8be3caa8e19a3cb9bd814ffa622823456263a34-1623239152176

#########################################
# Shared Module: Build
#########################################
FROM ${NODE_IMAGE} as base

RUN yum update -y && \
    yum install -y jq

COPY ./.config /src/.config
COPY ./shared /src/shared

WORKDIR /src/shared

RUN npm i
RUN npm run build

#########################################
# Portal: Build
#########################################
FROM base as builder

WORKDIR /src/audit-log-portal

COPY audit-log-portal/ ./

RUN npm i
RUN npm run build

#########################################
# Portal: Dependencies (prod)
#########################################
FROM base as prod_deps

WORKDIR /src/audit-log-portal

COPY audit-log-portal/package.json audit-log-portal/package-lock.json ./

RUN npm i --production

#########################################
# Portal: Package
#########################################
FROM ${NODE_IMAGE} as runner

WORKDIR /app

ENV NODE_ENV production

RUN yum install -y shadow-utils && \
    useradd nextjs && \
    groupadd nodejs && \
    usermod -a -G nodejs nextjs && \
    yum remove -y shadow-utils && \
    yum clean all && \
    rm -rf /var/cache/yum

COPY --from=builder /src/audit-log-portal/next.config.js ./
COPY --from=builder /src/audit-log-portal/public ./public
COPY --from=builder --chown=nextjs:nodejs /src/audit-log-portal/.next ./.next
COPY --from=prod_deps /src/audit-log-portal/node_modules ./node_modules
COPY --from=builder /src/audit-log-portal/package.json ./package.json

USER nextjs

EXPOSE 3000

# Disable anonymous telemetry
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["npm", "start"]
