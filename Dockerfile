FROM oven/bun:1
WORKDIR /app

# Install dependencies (ignore better-sqlite3 native postinstall — we use bun:sqlite instead)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Build frontend
RUN bun run build

# Expose backend port
EXPOSE 3002

# Start backend
CMD ["bun", "run", "server/index.ts"]
