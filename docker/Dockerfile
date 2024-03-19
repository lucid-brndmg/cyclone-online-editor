# Dockerfile for the next.js based frontend
FROM node:21-slim AS base
ENTRYPOINT ["/usr/local/bin/npm"]

# install dependencies
FROM base AS deps
WORKDIR /app
ADD package*.json .
RUN npm install

# dev server running in debug mode
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["run", "dev"]

# node.js based production server
FROM base AS prod
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_PYTHON_API_SERVER
RUN npm run build
EXPOSE 3000
CMD ["run", "start"]
