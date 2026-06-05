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
# Stocké comme template — traité par envsubst au démarrage (voir CMD ci-dessous)
COPY nginx.conf /etc/nginx/nginx.conf.template

EXPOSE 80
# On bypasse l'entrypoint nginx:alpine pour contrôler l'ordre :
# 1. Calculer PLAUSIBLE_EXTRA_SOURCES depuis PLAUSIBLE_URL (runtime, optionnel)
#    - si défini  → " https://votre-plausible.example.com"
#    - sinon      → "" (CSP inchangé, aucune erreur)
# 2. Substituer uniquement $PLAUSIBLE_EXTRA_SOURCES dans le template (les vars nginx $uri, $host… sont préservées)
# 3. Lancer nginx
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["export PLAUSIBLE_EXTRA_SOURCES=${PLAUSIBLE_URL:+ $PLAUSIBLE_URL} && \
  envsubst '$PLAUSIBLE_EXTRA_SOURCES' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && \
  exec nginx -g 'daemon off;'"]
