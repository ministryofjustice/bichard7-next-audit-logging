ARG NODE_IMAGE="nginx-nodejs-supervisord"

#########################################
# Portal: Build
#########################################
FROM ${NODE_IMAGE} as builder

WORKDIR /src/audit-log-portal

COPY ./* ./

RUN npm i && \
    npm run build

#########################################
# Portal: Dependencies (prod)
#########################################
FROM ${NODE_IMAGE} as prod_deps

WORKDIR /src/audit-log-portal

COPY ./package.json ./package-lock.json ./

RUN npm i --production


#########################################
# Portal: Package
#########################################
FROM ${NODE_IMAGE} as runner

WORKDIR /app

ENV NODE_ENV production

RUN useradd nextjs && \
    groupadd nodejs && \
    usermod -a -G nodejs nextjs && \
    yum clean all && \
    rm -rf /var/cache/yum

COPY --from=builder --chown=nextjs:nodejs /src/audit-log-portal/next.config.js ./next.config.js
COPY --from=builder --chown=nextjs:nodejs /src/audit-log-portal/build ./build
COPY --from=prod_deps /src/audit-log-portal/node_modules ./node_modules
COPY --from=builder /src/audit-log-portal/package.json ./package.json

EXPOSE 80
EXPOSE 443

ENV NEXT_TELEMETRY_DISABLED 1

COPY docker/conf/nginx.conf /etc/nginx/nginx.conf
COPY docker/conf/supervisord.conf /etc/supervisord.conf

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
