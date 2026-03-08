# chatbot-app spawns MCP server (server.py) and PromptWAF (promptWAF.py)
# as child processes via stdio, so everything must live in one container.
FROM node:18-slim

# Install Python 3, pip, build tools, and ping (healthcheck service needs it)
RUN apt-get update && \
    apt-get install -y python3 python3-pip build-essential iputils-ping && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install MCP server Python dependencies first (cached layer)
COPY mcp-server/requirements.txt /tmp/mcp-requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/mcp-requirements.txt

# Install Node.js dependencies (cached layer)
COPY chatbot-app/package*.json ./chatbot-app/
WORKDIR /app/chatbot-app
RUN npm install --legacy-peer-deps

# Copy all source code
WORKDIR /app
COPY chatbot-app/ ./chatbot-app/
COPY mcp-server/ ./mcp-server/
COPY data/ ./data/

WORKDIR /app/chatbot-app

EXPOSE 3000

CMD ["node", "server.js"]