FROM node:21-slim AS base
WORKDIR /app

# install dependencies
FROM base AS deps
ADD package*.json .
RUN npm install

# dev server
FROM base AS dev
ARG cyclone_version=1.10.1220-x64
ARG checksum=1fe30f945a61afa11ff9f5d16d8378bc6d77e85e12732a5864a862cc1596a0b0
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get -y install unzip openjdk-17-jre-headless
ADD --checksum=sha256:${checksum} https://classicwuhao.github.io/cyclone_tutorial/Cyclone-${cyclone_version}.zip /
RUN unzip /Cyclone-${cyclone_version}.zip -d /cyclone/

# enable this line to use the LATEST (experimental?) version of Cyclone
# ADD http://classicwuhao.github.io/cyclone_tutorial/cyclone.jar /cyclone/

ENV CYCLONE_ES_CYCLONE_PATH=/cyclone
ENV CYCLONE_ES_CYCLONE_SOURCE_PATH=/tmp/cyclone_src
ENV CYCLONE_ES_SERVER_HOST=0.0.0.0
# without LD_LIBRARY_PATH java execution fails to find Z3 solver bundled with Cyclone
ENV LD_LIBRARY_PATH=/cyclone
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 9000
CMD ["node", "server.js"]
