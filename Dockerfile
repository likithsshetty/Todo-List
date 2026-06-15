FROM node:20-bookworm

# Install Python, pip, git, and other utilities
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose Next.js and Flask ports
EXPOSE 3000
EXPOSE 5000

# Run the startup script
ENTRYPOINT ["/app/start.sh"]
