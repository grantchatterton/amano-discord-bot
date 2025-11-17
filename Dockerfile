# Use the official Node.js image based on Debian Bookworm
FROM node:lts-bookworm-slim

# Create a non-root user named "appuser"
RUN adduser --disabled-password --gecos "" appuser

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json into the working directory
COPY package*.json .

# Install production dependencies only
RUN npm ci --omit=dev

# Copy all files from the current directory to the container, preserving ownership
COPY --chown=appuser:appuser . .

# Switch to the non-root user
USER appuser

# Set the default command to run the application
CMD ["node", "src/index.js"]
