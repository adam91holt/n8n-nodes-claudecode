# n8n-nodes-claudecode

This is an n8n community node that allows you to use Claude Code CLI within your n8n workflows with support for streaming JSON output.

## Features

- Execute Claude Code CLI commands with the `-p` parameter for non-interactive usage
- Stream JSON output (JSONL format) for processing large responses
- Parse JSONL into structured data for easier workflow integration
- Support for all Claude models (Sonnet, Opus, Haiku)
- Configurable credentials for default settings
- Advanced options for fine-tuning behavior

## Installation

1. Install the node in your n8n instance:
   ```bash
   npm install n8n-nodes-claudecode
   ```

2. Restart n8n

3. The "Claude Code" node will now be available in the node palette

## Prerequisites

- Claude Code CLI must be installed on the system where n8n is running
- Either:
  - Claude Pro/Max subscription (logged in via browser)
  - Valid Anthropic API key

## Usage

### Basic Query

1. Add a "Claude Code" node to your workflow
2. Select "Query" operation
3. Enter your prompt
4. Choose output format:
   - **Structured**: Parses JSONL into organized data
   - **JSON Lines**: Raw JSONL output
   - **Plain Text**: Simple text output

### Credentials

The node supports two authentication methods:

#### 1. Claude Pro/Max Subscription (Recommended)
- **Authentication Method**: Select "Claude Pro Subscription (Browser)"
- **Browser Profile**: Use "default" or specify a custom profile
- **Note**: You must be logged into Claude.ai in your browser

#### 2. Anthropic API Key
- **Authentication Method**: Select "Anthropic API Key"
- **API Key**: Your Anthropic API key (sk-ant-...)

Other settings:
- **Project Path**: Default project directory
- **System Prompt**: Default system instructions
- **Model**: Default Claude model
- **Environment Variables**: Additional environment settings

### Advanced Options

- **Allowed Tools**: Enable specific Claude tools (Read, Write, Bash, etc.)
- **Max Turns**: Limit conversation length
- **Timeout**: Command execution timeout
- **Working Directory**: Override execution directory

## Example Workflows

### Code Analysis
```json
{
  "operation": "query",
  "prompt": "Analyze this codebase and find potential security issues",
  "projectPath": "/path/to/project",
  "outputFormat": "structured"
}
```

### Continuous Conversation
```json
{
  "operation": "continue",
  "prompt": "Now fix the issues you found",
  "outputFormat": "structured"
}
```

## Output Structure

When using "Structured" output format:
```json
{
  "messages": [...],      // All JSONL messages
  "summary": {
    "userMessageCount": 1,
    "assistantMessageCount": 2,
    "toolUseCount": 3,
    "hasResult": true
  },
  "result": {...},        // Final result object
  "error": "",           // Any stderr output
  "command": "..."       // Executed command
}
```

## Troubleshooting

- **Command not found**: Ensure Claude Code CLI is installed and in PATH
- **Authentication errors**: 
  - For Claude Pro: Ensure you're logged into Claude.ai in your browser
  - For API Key: Verify your key is valid and has sufficient credits
- **Timeout errors**: Increase timeout in advanced options
- **Missing result**: Known issue with streaming - implement retry logic
- **Browser profile issues**: Try using "default" profile or check browser is running

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev

# Lint
npm run lint
```

## License

MIT