# Dockerfile for the next.js based frontend
FROM node:21-alpine AS base
WORKDIR /app
ENTRYPOINT ["/usr/local/bin/npm"]

# install dependencies
FROM base AS deps
ADD package*.json .
RUN npm install

# dev server running in debug mode
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["run", "dev"]

# node.js based production server
FROM base AS prod
COPY --from=deps /app/node_modules ./node_modules
COPY . .
#ARG NEXT_PUBLIC_PYTHON_API_SERVER
# ARG sets variable during build process
# ENV injects it into the container
ARG PUBLIC_URL
ENV PUBLIC_URL=${PUBLIC_URL}
RUN npm run build
EXPOSE 3000
CMD ["run", "start"]
