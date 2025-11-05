
# Stage 1: Base image
FROM node:20-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm install -g @nestjs/cli
RUN npm install

# Stage 2: Development setup
FROM base AS development

WORKDIR /app
COPY . .
CMD ["npm", "run", "start:dev"]
