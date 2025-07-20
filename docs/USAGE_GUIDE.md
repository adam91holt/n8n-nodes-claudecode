# Claude Code n8n Node - Usage Guide

## Overview

The Claude Code n8n node enables you to integrate Claude Code CLI into your n8n workflows, allowing for automated code generation, analysis, and manipulation using Claude's AI capabilities.

## Key Features

1. **Non-Interactive Execution**: Uses the `-p` parameter for programmatic usage
2. **Streaming JSON Support**: Process Claude's responses in real-time with JSONL format
3. **Flexible Output Formats**: Choose between structured data, raw JSONL, or plain text
4. **Tool Integration**: Enable Claude to use various tools (Read, Write, Bash, etc.)
5. **Conversation Continuity**: Continue previous conversations with the `-c` flag

## Installation

### Prerequisites

1. **Claude Code CLI**: Must be installed and accessible in PATH
   ```bash
   npm install -g claude-code
   ```

2. **Authentication**: Choose one:
   - **Claude Pro/Max**: Active subscription and browser login
   - **API Key**: Valid Anthropic API key
   
3. **n8n Instance**: Running n8n instance (self-hosted or cloud)

### Install the Node

#### Option 1: NPM Install
```bash
cd ~/.n8n/custom
npm install n8n-nodes-claudecode
```

#### Option 2: Manual Install
```bash
cd ~/.n8n/custom
git clone https://github.com/adam91holt/n8n-nodes-claudecode.git
cd n8n-nodes-claudecode
npm install
npm run build
```

Restart n8n after installation.

## Configuration

### Setting Up Credentials

1. In n8n, go to **Credentials** → **New**
2. Search for "Claude Code API"
3. Configure:
   - **Project Path**: Default working directory
   - **System Prompt**: Default instructions for Claude
   - **Model**: Default model (sonnet/opus/haiku)
   - **Environment Variables**: Additional env vars (one per line)

### Node Configuration

#### Basic Options

- **Operation**: 
  - `Query`: New conversation
  - `Continue`: Continue existing conversation
  - `Advanced`: Full control over parameters

- **Prompt**: Your instruction to Claude

- **Output Format**:
  - `Structured`: Parsed JSON with summary
  - `JSON Lines`: Raw JSONL stream
  - `Plain Text`: Simple text output

#### Advanced Options

- **Model**: Override default model
- **System Prompt**: Custom instructions
- **Allowed Tools**: Enable specific capabilities
- **Max Turns**: Limit conversation length
- **Timeout**: Execution timeout (seconds)
- **Working Directory**: Override execution path

## Use Cases

### 1. Code Generation

```javascript
{
  "operation": "query",
  "prompt": "Create a Python FastAPI server with user authentication using JWT tokens",
  "outputFormat": "structured",
  "additionalOptions": {
    "allowedTools": ["Write", "Bash"],
    "maxTurns": 10
  }
}
```

### 2. Code Analysis

```javascript
{
  "operation": "query",
  "prompt": "Analyze this codebase for security vulnerabilities and performance issues",
  "projectPath": "/path/to/project",
  "outputFormat": "structured",
  "additionalOptions": {
    "allowedTools": ["Read"],
    "systemPrompt": "You are a security expert. Focus on OWASP top 10."
  }
}
```

### 3. Refactoring

```javascript
{
  "operation": "query",
  "prompt": "Refactor this code to use async/await instead of callbacks",
  "projectPath": "/path/to/project",
  "outputFormat": "structured",
  "additionalOptions": {
    "allowedTools": ["Read", "Edit"],
    "model": "opus"
  }
}
```

### 4. Documentation Generation

```javascript
{
  "operation": "query",
  "prompt": "Generate comprehensive API documentation for all endpoints",
  "outputFormat": "structured",
  "additionalOptions": {
    "allowedTools": ["Read", "Write"],
    "systemPrompt": "Generate OpenAPI 3.0 compatible documentation"
  }
}
```

## Working with Output

### Structured Output Format

```json
{
  "messages": [
    {"type": "user", "content": "..."},
    {"type": "assistant", "content": "..."},
    {"type": "tool_use", "content": {...}},
    {"type": "result", "success": true}
  ],
  "summary": {
    "userMessageCount": 1,
    "assistantMessageCount": 2,
    "toolUseCount": 3,
    "hasResult": true
  },
  "result": {...},
  "error": "",
  "command": "claude -p \"...\" --output-format stream-json"
}
```

### Processing in n8n

#### Extract Tool Uses
```javascript
// Function node code
const messages = $json.messages || [];
const toolUses = messages.filter(m => m.type === 'tool_use');

return toolUses.map(tool => ({
  json: {
    toolName: tool.content?.tool_name,
    toolInput: tool.content?.tool_input,
    timestamp: tool.timestamp
  }
}));
```

#### Get Final Result
```javascript
// Function node code
const result = $json.result;
if (!result || !result.success) {
  throw new Error('No successful result found');
}
return [{
  json: {
    output: result.content,
    tokensUsed: result.usage?.total_tokens || 0
  }
}];
```

## Error Handling

### Common Issues

1. **Command Not Found**
   - Ensure Claude Code CLI is installed
   - Check PATH environment variable

2. **Timeout Errors**
   - Increase timeout in advanced options
   - Break complex tasks into smaller prompts

3. **Missing Result Event**
   - Known streaming issue
   - Implement retry logic in workflow

### Workflow Error Handling

```
[Claude Code Node] → [IF Error] → [Error Handler]
                  ↓
              [Success Path]
```

Use the "Continue on Fail" option to handle errors gracefully.

## Best Practices

1. **Start Small**: Test with simple prompts first
2. **Use Appropriate Models**: 
   - Haiku: Fast, simple tasks
   - Sonnet: Balanced performance
   - Opus: Complex reasoning
3. **Limit Scope**: Use project paths to focus Claude
4. **Monitor Usage**: Track token consumption
5. **Version Control**: Claude can use git - leverage it
6. **Security**: Never expose API keys in prompts

## Advanced Workflows

### Multi-Step Code Generation

```
[Trigger] → [Claude: Design] → [Claude: Implement] → [Claude: Test] → [Git Commit]
```

### Code Review Pipeline

```
[GitHub PR] → [Claude: Review] → [Format Results] → [Post Comment]
```

### Automated Refactoring

```
[File Monitor] → [Claude: Analyze] → [If: Needs Refactor] → [Claude: Refactor] → [Create PR]
```

## Performance Tips

1. **Batch Operations**: Process multiple files in one prompt
2. **Streaming**: Use JSONL for large responses
3. **Caching**: Store Claude responses for reuse
4. **Parallel Processing**: Run multiple Claude nodes concurrently

## Troubleshooting

### Debug Mode

Enable verbose output:
```javascript
{
  "additionalOptions": {
    "verbose": true
  }
}
```

### Check Command Execution

The node returns the executed command in the output:
```json
{
  "command": "claude -p \"...\" --output-format stream-json --model sonnet"
}
```

### Logging

Check n8n logs for detailed error messages:
```bash
docker logs n8n
# or
journalctl -u n8n
```

## Support

- **Issues**: https://github.com/adam91holt/n8n-nodes-claudecode/issues
- **Documentation**: https://docs.anthropic.com/claude-code
- **n8n Community**: https://community.n8n.io