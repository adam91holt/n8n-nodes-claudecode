# Claude Code n8n Node - Authentication Guide

## Overview

The Claude Code n8n node supports two authentication methods:
1. **Claude Pro/Max Subscription** (via browser) - Recommended
2. **Anthropic API Key** (traditional method)

## Method 1: Claude Pro/Max Subscription (Browser Authentication)

This method uses your existing Claude Pro or Claude Max subscription through your browser session.

### Prerequisites
- Active Claude Pro or Claude Max subscription
- Logged into Claude.ai in your browser
- Claude Code CLI installed

### Setup Steps

1. **Login to Claude.ai**
   ```bash
   # Open your browser and go to:
   https://claude.ai
   # Log in with your account
   ```

2. **Configure n8n Credentials**
   - Go to n8n → Credentials → New
   - Select "Claude Code API"
   - Choose **Authentication Method**: "Claude Pro Subscription (Browser)"
   - Set **Browser Profile**: "default" (or your custom profile name)
   - Save credentials

3. **First-Time Setup**
   - The first time you use the node, Claude Code CLI may open a browser window
   - If prompted, confirm the connection
   - The authentication will be cached for future use

### Browser Profiles

You can use different browser profiles for different Claude accounts:

```javascript
// Default profile (main browser session)
{
  "authMethod": "browser",
  "browserProfile": "default"
}

// Custom profile
{
  "authMethod": "browser",
  "browserProfile": "work-account"
}
```

### How It Works

When using browser authentication:
- Claude Code CLI connects to your existing browser session
- Uses cookies and session data from Claude.ai
- No API key required
- Uses your subscription limits (Claude Pro/Max)
- Supports all Claude Pro features

## Method 2: Anthropic API Key

Traditional API key authentication for programmatic access.

### Prerequisites
- Anthropic API key from https://console.anthropic.com
- API credits available

### Setup Steps

1. **Get API Key**
   - Go to https://console.anthropic.com
   - Navigate to API Keys
   - Create a new key or copy existing one

2. **Configure n8n Credentials**
   - Go to n8n → Credentials → New
   - Select "Claude Code API"
   - Choose **Authentication Method**: "Anthropic API Key"
   - Enter your **API Key**: sk-ant-...
   - Save credentials

3. **Usage**
   - The node will automatically use the API key
   - Each request consumes API credits
   - Rate limits apply based on your tier

### Environment Variable Alternative

You can also set the API key via environment variable:

```bash
# In your n8n environment
export ANTHROPIC_API_KEY=sk-ant-...
```

Then in credentials, add to Environment Variables field:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Authentication Override

You can override authentication for specific executions:

### In Node Settings (Advanced Options)
```javascript
{
  "additionalOptions": {
    "useApiKeyOverride": true,
    "apiKeyOverride": "sk-ant-different-key"
  }
}
```

This is useful for:
- Testing different API keys
- Using different accounts for specific workflows
- Temporary access with limited keys

## Command Line Flags

The node automatically adds the correct flags based on authentication:

### Browser Authentication
```bash
claude -p "prompt" --use-browser --browser-profile "default"
```

### API Key Authentication
```bash
# API key is passed via environment variable
ANTHROPIC_API_KEY=sk-ant-... claude -p "prompt"
```

## Switching Between Methods

To switch authentication methods:

1. Edit your Claude Code credentials in n8n
2. Change "Authentication Method" dropdown
3. Fill in the required fields for the new method
4. Save credentials
5. Test with a simple query

## Troubleshooting

### Browser Authentication Issues

**"Not logged in" error**
- Open Claude.ai in your browser
- Log in with your account
- Try the node again

**"Browser not found" error**
- Ensure you have Chrome/Chromium installed
- Check browser profile name is correct
- Try using "default" profile

**Session expired**
- Log out and back into Claude.ai
- Clear browser cookies for Claude.ai and re-login

### API Key Authentication Issues

**"Invalid API key" error**
- Verify key starts with "sk-ant-"
- Check key hasn't been revoked
- Ensure no extra spaces in key

**"Insufficient credits" error**
- Check your API credit balance
- Add credits at console.anthropic.com

**Rate limit errors**
- Implement retry logic in workflow
- Upgrade API tier for higher limits

## Best Practices

### For Claude Pro Users
1. Use browser authentication for personal projects
2. Keep browser logged in for automation
3. Use specific browser profiles for different accounts
4. Monitor your Pro usage limits

### For API Key Users
1. Store keys securely in n8n credentials
2. Use separate keys for dev/prod
3. Monitor API credit usage
4. Implement error handling for rate limits

### Security Considerations
- Never expose API keys in prompts or logs
- Use n8n's credential encryption
- Rotate API keys regularly
- Use browser profiles to isolate accounts

## FAQ

**Q: Which method should I use?**
A: If you have Claude Pro/Max, use browser authentication. It's simpler and uses your subscription. Use API keys for production systems or when you need programmatic access.

**Q: Can I use both methods?**
A: Yes, you can create multiple credentials with different methods and choose which to use per node.

**Q: Does browser auth work in Docker?**
A: It requires additional setup for browser access in containers. API keys are easier for containerized deployments.

**Q: Are there usage differences?**
A: Browser auth uses your Claude Pro limits. API keys use credit-based pricing and have different rate limits.