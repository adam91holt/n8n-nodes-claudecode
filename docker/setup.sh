#!/bin/bash

# Claude Code n8n Docker Setup Script
set -e

echo "======================================"
echo "Claude Code n8n Module Setup"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed!"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed!"
    echo "Please install docker-compose first"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file to configure authentication"
fi

# Ask for authentication method
echo ""
echo "Choose authentication method:"
echo "1) Claude Pro/Max (Browser) - Recommended if you have a subscription"
echo "2) Anthropic API Key"
read -p "Select (1 or 2): " auth_choice

case $auth_choice in
    1)
        sed -i '' 's/CLAUDE_AUTH_METHOD=.*/CLAUDE_AUTH_METHOD=browser/' .env
        echo ""
        echo "Browser authentication selected."
        echo "You'll need to login to Claude.ai after the containers start."
        ;;
    2)
        sed -i '' 's/CLAUDE_AUTH_METHOD=.*/CLAUDE_AUTH_METHOD=apikey/' .env
        echo ""
        read -p "Enter your Anthropic API key: " api_key
        sed -i '' "s/# ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$api_key/" .env
        echo "API key configured."
        ;;
esac

# Build and start containers
echo ""
echo "Building Docker images..."
docker-compose build

echo ""
echo "Starting containers..."
docker-compose up -d

# Wait for n8n to be ready
echo ""
echo "Waiting for n8n to start..."
sleep 10

# Check if n8n is running
if docker-compose ps | grep -q "n8n.*Up"; then
    echo "✅ n8n is running!"
else
    echo "❌ n8n failed to start. Check logs with: docker-compose logs n8n"
    exit 1
fi

# Show authentication instructions
echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "n8n is running at: http://localhost:5678"
echo "Login: admin / claudecode"
echo ""

if [ "$auth_choice" = "1" ]; then
    echo "Browser Authentication Setup:"
    echo "----------------------------"
    echo "Option 1: Use the Chrome container (easier)"
    echo "  1. Run: docker-compose --profile auth up -d chrome"
    echo "  2. Open http://localhost:7900 in your browser"
    echo "  3. Login to claude.ai in the Chrome window"
    echo "  4. Run: docker-compose exec n8n claude auth login"
    echo ""
    echo "Option 2: Copy your existing Chrome profile"
    echo "  1. Find your Chrome profile (usually ~/.config/google-chrome)"
    echo "  2. Copy it: docker cp ~/.config/google-chrome n8n-claudecode:/home/node/.config/"
    echo ""
    read -p "Would you like to start the Chrome container now? (y/n): " start_chrome
    if [ "$start_chrome" = "y" ]; then
        docker-compose --profile auth up -d chrome
        echo "Chrome container started!"
        echo "Access it at: http://localhost:7900"
        echo "No password required - just click Connect"
    fi
else
    echo "API Key Authentication is configured and ready to use!"
fi

echo ""
echo "To view logs: docker-compose logs -f n8n"
echo "To stop: docker-compose down"
echo "To restart: docker-compose restart"
echo ""
echo "The Claude Code node should now be available in n8n!"