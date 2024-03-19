FROM node:21-slim AS base
WORKDIR /app

# install dependencies
FROM base AS deps
ADD package*.json .
RUN npm install

# dev server
FROM base AS dev
ARG cyclone_version=1.08.848-x64
ARG checksum=e9ba694d3addb8a80bb9e9a14aa9e8837910e668cb3514ec0d736ec3275683ce
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get -y install unzip openjdk-17-jre-headless
ADD --checksum=sha256:${checksum} https://classicwuhao.github.io/cyclone_tutorial/Cyclone-${cyclone_version}.zip /
RUN unzip /Cyclone-${cyclone_version}.zip -d /cyclone/
ENV CYCLONE_ES_CYCLONE_PATH=/cyclone
ENV CYCLONE_ES_CYCLONE_SOURCE_PATH=/tmp/cyclone_src
ENV CYCLONE_ES_SERVER_HOST=0.0.0.0
# without LD_LIBRARY_PATH java execution fails to find Z3 solver bundled with Cyclone
ENV LD_LIBRARY_PATH=/cyclone
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 9000
CMD ["node", "server.js"]
