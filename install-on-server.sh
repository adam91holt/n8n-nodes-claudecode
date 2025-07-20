#!/bin/bash
# n8n Claude Code Node Installation Script

set -e

echo "======================================"
echo "n8n Claude Code Node Installation"
echo "======================================"

# Check if n8n custom directory exists
N8N_CUSTOM_DIR="$HOME/.n8n/custom"
if [ ! -d "$N8N_CUSTOM_DIR" ]; then
    echo "Creating n8n custom directory..."
    mkdir -p "$N8N_CUSTOM_DIR"
fi

cd "$N8N_CUSTOM_DIR"

# Extract the package
echo "Extracting n8n-nodes-claudecode..."
tar -xzf ~/n8n-nodes-claudecode.tar.gz

# Create a directory for the node
mkdir -p n8n-nodes-claudecode
mv package.json package-lock.json dist/ credentials/ nodes/ n8n-nodes-claudecode/

# Install the node
cd n8n-nodes-claudecode
echo "Installing dependencies..."
npm install --production

echo ""
echo "✅ Installation complete!"
echo ""
echo "Please restart your n8n instance for the changes to take effect."
echo ""
echo "The Claude Code node should now be available in your n8n workflow editor."
echo ""
echo "Note: Make sure Claude Code CLI is installed on your server:"
echo "  npm install -g claude-code"