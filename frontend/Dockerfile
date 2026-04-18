# --- ETAPA 1: Base (Node y dependencias) ---
FROM node:20-alpine AS base
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install

# --- ETAPA 2: Development (Target: development) ---
FROM base AS development
COPY ./frontend .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --- ETAPA 3: Build (Compilación) ---
FROM base AS build
COPY ./frontend .
RUN npm run build

# --- ETAPA 4: Production (Servidor ligero con Nginx) ---
FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]