# ─── Frontend Dockerfile (multi-stage) ───────────────────────────────────────
#
# Stage 1 (builder): Install npm dependencies and build the React app.
# Stage 2 (runtime): Serve the static build with Nginx (tiny image, ~20 MB).

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better Docker layer caching:
# If only source files change, npm install is skipped on rebuild
COPY package*.json ./
RUN npm ci --silent

# Copy remaining source and build
# REACT_APP_API_URL is injected at build time via --build-arg
ARG REACT_APP_API_URL=http://localhost:8000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY . .
RUN npm run build


# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config (SPA routing + security headers)
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy the React production build from stage 1
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx listens on port 80 inside the container
EXPOSE 80

# Nginx runs in the foreground (required for Docker)
CMD ["nginx", "-g", "daemon off;"]
