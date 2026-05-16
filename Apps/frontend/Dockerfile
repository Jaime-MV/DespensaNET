FROM node:20-alpine
WORKDIR /app

# Copy root package.json and lockfile
COPY package*.json ./
# Copy workspace definitions
COPY turbo.json ./
# Copy apps and packages
COPY apps/frontend ./apps/frontend
COPY packages ./packages

# Install dependencies
RUN npm install

# Expose frontend port (Vite default)
EXPOSE 5173

# Default command
CMD ["npm", "run", "dev", "--workspace=apps/frontend", "--", "--host"]
