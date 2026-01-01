FROM ubuntu:24.04 AS base
ADD https://deb.nodesource.com/setup_lts.x /nodesource_setup.sh
RUN chmod 750 /nodesource_setup.sh
RUN /nodesource_setup.sh
RUN apt update && apt install -y nodejs
WORKDIR /app

# install dependencies
FROM base AS deps
ADD package*.json .
RUN npm install

# dev server
FROM base AS dev
ARG cyclone_version=1.10.1462-x64
ARG checksum=5ba658013730cbfa3aec9e73ca64690b97f26d2bb085fdd31ef125f979a13506
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
