FROM node:22-alpine AS deps
WORKDIR /app

# Dépendances reproductibles (lockfile requis)
COPY package*.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline


FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


FROM nginx:alpine AS runner

# Serveur web + fallback SPA + proxy vers /api (docker-compose: service "backend")
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


# Cible optionnelle pour le dev (Debian slim pour eviter les soucis DNS d'Alpine)
FROM node:22-slim AS dev
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm ci --prefer-offline
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]