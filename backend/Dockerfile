# Backend Medusa (API + admin).
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx medusa build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.medusa/server ./
RUN npm install --omit=dev
EXPOSE 9000
# Applique les migrations à chaque démarrage (sans effet si la base est à jour).
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
