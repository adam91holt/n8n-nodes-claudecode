# Docker Setup for n8n with Claude Code Module

This Docker setup provides a complete n8n instance with the Claude Code module pre-installed and configured.

## Features

- ✅ n8n with Claude Code module pre-installed
- ✅ Claude Code CLI included
- ✅ Support for both Claude Pro and API key authentication
- ✅ Optional Chrome container for browser authentication
- ✅ Persistent data volumes
- ✅ Health checks and auto-restart

## Quick Start

### 1. Clone and Navigate
```bash
cd n8n-nodes-claudecode/docker
```

### 2. Run Setup Script
```bash
./setup.sh
```

The script will:
- Check Docker installation
- Create .env file
- Ask for authentication method
- Build and start containers
- Provide authentication instructions

### 3. Access n8n
- URL: http://localhost:5678
- Login: admin / claudecode

## Authentication Methods

### Option 1: Claude Pro/Max (Browser)

If you have a Claude Pro or Max subscription:

1. **Start Chrome container**:
   ```bash
   docker-compose --profile auth up -d chrome
   ```

2. **Access Chrome**:
   - Open http://localhost:7900 in your browser
   - Click "Connect" (no password)
   - Navigate to claude.ai and login

3. **Authenticate Claude CLI**:
   ```bash
   docker-compose exec n8n claude auth login
   ```

### Option 2: API Key

If using an Anthropic API key:

1. **Set in .env**:
   ```env
   CLAUDE_AUTH_METHOD=apikey
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

2. **Restart**:
   ```bash
   docker-compose restart n8n
   ```

## Manual Setup

### 1. Create .env file
```bash
cp .env.example .env
# Edit .env with your settings
```

### 2. Build and Start
```bash
docker-compose build
docker-compose up -d
```

### 3. Check Status
```bash
docker-compose ps
docker-compose logs -f n8n
```

## Docker Compose Commands

### Start Services
```bash
# Start n8n only
docker-compose up -d

# Start with Chrome for authentication
docker-compose --profile auth up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All logs
docker-compose logs -f

# n8n logs only
docker-compose logs -f n8n
```

### Execute Commands
```bash
# Check Claude auth status
docker-compose exec n8n claude auth status

# Run Claude command
docker-compose exec n8n claude -p "Hello"
```

### Update Module
```bash
# Rebuild with latest changes
docker-compose build --no-cache
docker-compose up -d
```

## Volumes

- `n8n_data`: n8n configuration and workflows
- `chrome_data`: Browser profile for Claude authentication

### Backup
```bash
# Backup n8n data
docker run --rm -v n8n_claudecode_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n-backup.tar.gz -C /data .

# Backup Chrome profile
docker run --rm -v n8n_chrome_data:/data -v $(pwd):/backup alpine tar czf /backup/chrome-backup.tar.gz -C /data .
```

### Restore
```bash
# Restore n8n data
docker run --rm -v n8n_claudecode_data:/data -v $(pwd):/backup alpine tar xzf /backup/n8n-backup.tar.gz -C /data

# Restore Chrome profile
docker run --rm -v n8n_chrome_data:/data -v $(pwd):/backup alpine tar xzf /backup/chrome-backup.tar.gz -C /data
```

## Environment Variables

### Authentication
- `CLAUDE_AUTH_METHOD`: `browser` or `apikey`
- `ANTHROPIC_API_KEY`: Your API key (if using apikey method)
- `CLAUDE_BROWSER_PROFILE`: Browser profile name (default: `default`)

### n8n Configuration
- `N8N_BASIC_AUTH_USER`: Web UI username
- `N8N_BASIC_AUTH_PASSWORD`: Web UI password
- `N8N_ENCRYPTION_KEY`: Data encryption key
- `N8N_HOST`: Hostname (default: localhost)
- `N8N_PORT`: Port (default: 5678)

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs n8n

# Check disk space
df -h

# Restart
docker-compose down
docker-compose up -d
```

### Authentication Issues

**Browser Auth**:
1. Ensure Chrome container is running
2. Check you're logged into claude.ai
3. Try clearing Chrome data volume and re-login

**API Key Auth**:
1. Verify API key in .env
2. Check key has credits
3. Test directly: `docker-compose exec n8n claude -p "test"`

### Module Not Appearing
1. Restart n8n: `docker-compose restart n8n`
2. Check installation: `docker-compose exec n8n ls /home/node/.n8n/custom`
3. Rebuild: `docker-compose build --no-cache`

### Permission Issues
```bash
# Fix permissions
docker-compose exec --user root n8n chown -R node:node /home/node/.n8n
```

## Development

### Updating the Module
1. Make changes to the module code
2. Rebuild: `docker-compose build`
3. Restart: `docker-compose restart n8n`

### Debug Mode
```bash
# Run with debug output
docker-compose run --rm -e NODE_ENV=development n8n
```

### Shell Access
```bash
# Access n8n container
docker-compose exec n8n /bin/sh

# As root
docker-compose exec --user root n8n /bin/sh
```

## Security Notes

1. **Change default passwords** in production
2. **Use HTTPS** with a reverse proxy for internet access
3. **Secure your API keys** - never commit .env files
4. **Regular backups** of volumes
5. **Update regularly** for security patches

## Support

- Module Issues: https://github.com/adam91holt/n8n-nodes-claudecode/issues
- n8n Help: https://community.n8n.io
- Claude Code: https://github.com/anthropics/claude-code