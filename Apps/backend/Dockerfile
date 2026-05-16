FROM node:20-alpine
WORKDIR /app

# Copy root package.json and lockfile
COPY package*.json ./
# Copy workspace definitions
COPY turbo.json ./
# Copy apps and packages
COPY apps/backend ./apps/backend
COPY packages ./packages

# Install dependencies (this will install for the whole monorepo)
RUN npm install

# Expose backend port
EXPOSE 3000

# Default command (can be overridden by docker-compose)
CMD ["npm", "run", "dev", "--workspace=apps/backend"]
