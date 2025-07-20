#!/bin/bash

# Claude Code Authentication Helper for Docker
set -e

echo "======================================"
echo "Claude Code Authentication Helper"
echo "======================================"

# Function to check if running in Docker
in_docker() {
    [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null
}

# Function to setup browser auth
setup_browser_auth() {
    echo "Setting up browser authentication..."
    
    if in_docker; then
        echo ""
        echo "⚠️  Running inside Docker container"
        echo ""
        echo "Option 1: Use Chrome container (recommended)"
        echo "  From your host machine, run:"
        echo "  docker-compose --profile auth up -d chrome"
        echo "  Then open: http://localhost:7900"
        echo "  Login to claude.ai in the browser"
        echo ""
        echo "Option 2: Copy existing profile"
        echo "  From your host machine, run:"
        echo "  docker cp ~/.config/google-chrome n8n-claudecode:/home/node/.config/"
        echo ""
        read -p "Press Enter when ready to continue..."
    fi
    
    # Try to authenticate
    echo "Running Claude authentication..."
    claude auth login || {
        echo "Authentication failed. Please try the manual steps above."
        exit 1
    }
}

# Function to test authentication
test_auth() {
    echo ""
    echo "Testing authentication..."
    
    if claude -p "Say 'Hello from Docker!'" --max-turns 1; then
        echo ""
        echo "✅ Authentication successful!"
        return 0
    else
        echo ""
        echo "❌ Authentication test failed"
        return 1
    fi
}

# Main logic
main() {
    # Check current auth status
    echo "Checking current authentication status..."
    
    if claude auth status 2>/dev/null; then
        echo "Already authenticated!"
        test_auth
        exit 0
    fi
    
    # Not authenticated, check method
    AUTH_METHOD="${CLAUDE_AUTH_METHOD:-browser}"
    
    case "$AUTH_METHOD" in
        "browser"|"pro")
            setup_browser_auth
            ;;
        "apikey"|"api")
            if [ -z "$ANTHROPIC_API_KEY" ]; then
                echo "❌ Error: ANTHROPIC_API_KEY not set!"
                echo "Please set it in your .env file or environment"
                exit 1
            fi
            echo "Using API key authentication"
            # API key should work automatically
            ;;
        *)
            echo "❌ Unknown authentication method: $AUTH_METHOD"
            exit 1
            ;;
    esac
    
    # Test the authentication
    test_auth || {
        echo ""
        echo "Need help? Check the troubleshooting guide:"
        echo "docker/README.md#troubleshooting"
        exit 1
    }
}

# Run main function
main "$@"