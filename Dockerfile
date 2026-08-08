# SebilAI — Fly.io container.
# Port MUST match fly.toml internal_port (8080). The app reads process.env.PORT.
FROM node:20-slim
WORKDIR /app

# Install prod deps only, using the lockfile for reproducible builds.
COPY package*.json ./
RUN npm ci --omit=dev

# App source (node_modules excluded via .dockerignore so the Linux modules
# from `npm ci` are not overwritten by the host's).
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
