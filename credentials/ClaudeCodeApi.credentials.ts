import type {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class ClaudeCodeApi implements ICredentialType {
  name = 'claudeCodeApi';
  displayName = 'Claude Code Settings';
  documentationUrl = 'https://github.com/adam91holt/n8n-nodes-claudecode';
  properties: INodeProperties[] = [
    {
      displayName: 'Info',
      name: 'info',
      type: 'notice',
      default: '',
      description: 'Claude Code CLI must be installed and authenticated on your n8n server. Run "claude auth status" to verify.',
    },
    {
      displayName: 'System Prompt',
      name: 'systemPrompt',
      type: 'string',
      typeOptions: {
        rows: 4,
      },
      default: '',
      description: 'Default system prompt for Claude Code (optional)',
    },
    {
      displayName: 'Environment Variables',
      name: 'envVars',
      type: 'string',
      typeOptions: {
        rows: 4,
      },
      default: '',
      description: 'Additional environment variables (KEY=value format, one per line)',
      placeholder: 'CLAUDE_DEBUG=true\nCUSTOM_VAR=value',
    },
  ];
}