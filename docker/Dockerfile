# Use n8n's official image as base
FROM n8nio/n8n:latest

# Switch to root to install dependencies
USER root

# Install required packages
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver \
    python3 \
    py3-pip \
    nodejs \
    npm \
    git \
    curl \
    bash \
    xvfb \
    x11vnc \
    fluxbox \
    dbus \
    ttf-freefont

# Install Claude Code CLI globally
RUN npm install -g claude-code@latest

# Create custom extensions directory
RUN mkdir -p /home/node/.n8n/custom && \
    chown -R node:node /home/node/.n8n

# Copy the n8n-nodes-claudecode module
COPY --chown=node:node . /tmp/n8n-nodes-claudecode/

# Install the module
WORKDIR /home/node/.n8n/custom
RUN npm install /tmp/n8n-nodes-claudecode && \
    rm -rf /tmp/n8n-nodes-claudecode

# Create authentication script
RUN cat > /usr/local/bin/claude-auth-setup.sh << 'EOF'
#!/bin/bash
set -e

echo "========================================="
echo "Claude Code Authentication Setup"
echo "========================================="

# Check if Claude CLI is available
if ! command -v claude &> /dev/null; then
    echo "Error: Claude Code CLI not found!"
    exit 1
fi

# Check authentication method from environment
AUTH_METHOD="${CLAUDE_AUTH_METHOD:-browser}"
echo "Authentication method: $AUTH_METHOD"

case "$AUTH_METHOD" in
    "apikey"|"api")
        if [ -z "$ANTHROPIC_API_KEY" ]; then
            echo "Error: ANTHROPIC_API_KEY environment variable not set!"
            echo "Please set it in docker-compose.yml or .env file"
            exit 1
        fi
        echo "Using API key authentication"
        # API key is already in environment, claude will use it
        ;;
    "browser"|"pro")
        echo "Using browser authentication (Claude Pro/Max)"
        echo ""
        echo "Option 1: Use the Chrome container"
        echo "  - Open http://localhost:7900 in your browser"
        echo "  - Login to claude.ai"
        echo "  - Then run: docker-compose exec n8n claude auth login"
        echo ""
        echo "Option 2: Copy existing browser profile"
        echo "  - Copy your Chrome profile to the volume"
        echo "  - Run: docker cp ~/.config/google-chrome n8n-claudecode:/home/node/.config/"
        echo ""
        # Try to check auth status
        claude auth status || true
        ;;
    *)
        echo "Error: Unknown authentication method: $AUTH_METHOD"
        echo "Use 'browser' or 'apikey'"
        exit 1
        ;;
esac

echo ""
echo "Testing Claude CLI..."
if [ "$AUTH_METHOD" = "apikey" ]; then
    claude -p "Say 'Authentication successful!'" --max-turns 1 || echo "Test failed - check your API key"
else
    echo "Browser auth requires manual login first"
fi

echo ""
echo "Setup complete! You can now use the Claude Code node in n8n"
echo "Access n8n at: http://localhost:5678"
echo "Default login: admin / claudecode"
EOF

RUN chmod +x /usr/local/bin/claude-auth-setup.sh

# Create startup script
RUN cat > /docker-entrypoint-custom.sh << 'EOF'
#!/bin/bash
set -e

# Run authentication setup in background
/usr/local/bin/claude-auth-setup.sh &

# Start n8n
exec n8n
EOF

RUN chmod +x /docker-entrypoint-custom.sh

# Switch back to node user
USER node

# Set Chrome to run in headless mode by default
ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/bin/chromium-browser \
    CHROMIUM_FLAGS="--disable-software-rasterizer --disable-dev-shm-usage"

# Expose n8n port
EXPOSE 5678

# Start with custom entrypoint
ENTRYPOINT ["/docker-entrypoint-custom.sh"]