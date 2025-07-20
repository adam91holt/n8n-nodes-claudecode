import type {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class ClaudeCodeApi implements ICredentialType {
  name = 'claudeCodeApi';
  displayName = 'Claude Code API';
  documentationUrl = 'https://github.com/adam91holt/n8n-nodes-claudecode';
  properties: INodeProperties[] = [
    {
      displayName: 'Authentication Method',
      name: 'authMethod',
      type: 'options',
      options: [
        {
          name: 'Claude Pro Subscription (Browser)',
          value: 'browser',
          description: 'Use your Claude Pro/Max subscription via browser authentication',
        },
        {
          name: 'Anthropic API Key',
          value: 'apiKey',
          description: 'Use an Anthropic API key',
        },
      ],
      default: 'browser',
      description: 'How to authenticate with Claude',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Your Anthropic API key (sk-ant-...)',
      displayOptions: {
        show: {
          authMethod: ['apiKey'],
        },
      },
    },
    {
      displayName: 'Browser Profile',
      name: 'browserProfile',
      type: 'string',
      default: 'default',
      description: 'Browser profile name for Claude Pro authentication. Use "default" for the main profile.',
      displayOptions: {
        show: {
          authMethod: ['browser'],
        },
      },
    },
    {
      displayName: 'Claude Pro Notice',
      name: 'proNotice',
      type: 'notice',
      default: '',
      description: 'Make sure you are logged into Claude.ai in your browser before using this node. Claude Code CLI will use your existing browser session.',
      displayOptions: {
        show: {
          authMethod: ['browser'],
        },
      },
    },
    {
      displayName: 'Project Path',
      name: 'projectPath',
      type: 'string',
      default: '',
      description: 'Default project path for Claude Code CLI (optional). Can be overridden in node.',
      placeholder: '/path/to/project',
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
      displayName: 'Model',
      name: 'model',
      type: 'options',
      options: [
        {
          name: 'Claude 3 Sonnet',
          value: 'sonnet',
        },
        {
          name: 'Claude 3 Opus',
          value: 'opus',
        },
        {
          name: 'Claude 3 Haiku',
          value: 'haiku',
        },
      ],
      default: 'sonnet',
      description: 'Default Claude model to use',
    },
    {
      displayName: 'Environment Variables',
      name: 'envVars',
      type: 'string',
      typeOptions: {
        rows: 4,
      },
      default: '',
      description: 'Environment variables to set for Claude Code CLI (KEY=value format, one per line)',
      placeholder: 'ANTHROPIC_API_KEY=sk-ant-...\nCLAUDE_DEBUG=true',
    },
  ];
}