FROM node:20-bookworm-slim AS builder

WORKDIR /app
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Analytics Plausible (optionnel - laisser vide pour désactiver)
ARG VITE_PLAUSIBLE_DOMAIN=
ARG VITE_PLAUSIBLE_URL=
ENV VITE_PLAUSIBLE_DOMAIN=$VITE_PLAUSIBLE_DOMAIN
ENV VITE_PLAUSIBLE_URL=$VITE_PLAUSIBLE_URL
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
