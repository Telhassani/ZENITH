FROM oven/bun:1
WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Explicitly set Python path for node-gyp
ENV PYTHON=/usr/bin/python3

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend
RUN bun run build

# Expose backend port
EXPOSE 3002

# Start backend
CMD ["bun", "run", "server/index.ts"]
