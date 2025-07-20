import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

export class ClaudeCode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Claude Code',
    name: 'claudeCode',
    icon: 'file:claudecode.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["prompt"]}}',
    description: 'Execute Claude Code CLI commands with streaming JSON support',
    defaults: {
      name: 'Claude Code',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'claudeCodeApi',
        required: false,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Query',
            value: 'query',
            description: 'Execute a query using Claude Code CLI',
          },
          {
            name: 'Continue',
            value: 'continue',
            description: 'Continue a previous conversation',
          },
          {
            name: 'Advanced',
            value: 'advanced',
            description: 'Execute with advanced options',
          },
        ],
        default: 'query',
      },
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        default: '',
        placeholder: 'Explain this code...',
        description: 'The prompt to send to Claude',
        required: true,
      },
      {
        displayName: 'Project Path',
        name: 'projectPath',
        type: 'string',
        default: '',
        placeholder: '/path/to/project',
        description: 'Override the project path for this execution',
        displayOptions: {
          show: {
            operation: ['query', 'advanced'],
          },
        },
      },
      {
        displayName: 'Output Format',
        name: 'outputFormat',
        type: 'options',
        options: [
          {
            name: 'JSON Lines (Streaming)',
            value: 'stream-json',
            description: 'Get streaming JSON output (JSONL format)',
          },
          {
            name: 'Plain Text',
            value: 'text',
            description: 'Get plain text output',
          },
          {
            name: 'Structured',
            value: 'structured',
            description: 'Parse JSONL into structured data',
          },
        ],
        default: 'structured',
        description: 'How to format the output',
      },
      {
        displayName: 'Additional Options',
        name: 'additionalOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
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
            description: 'Override the Claude model',
          },
          {
            displayName: 'System Prompt',
            name: 'systemPrompt',
            type: 'string',
            typeOptions: {
              rows: 4,
            },
            default: '',
            description: 'Override the system prompt',
          },
          {
            displayName: 'Allowed Tools',
            name: 'allowedTools',
            type: 'multiOptions',
            options: [
              {
                name: 'Bash',
                value: 'Bash',
              },
              {
                name: 'Read',
                value: 'Read',
              },
              {
                name: 'Write',
                value: 'Write',
              },
              {
                name: 'Edit',
                value: 'Edit',
              },
              {
                name: 'WebSearch',
                value: 'WebSearch',
              },
              {
                name: 'WebFetch',
                value: 'WebFetch',
              },
            ],
            default: [],
            description: 'Tools to allow Claude to use',
          },
          {
            displayName: 'Max Turns',
            name: 'maxTurns',
            type: 'number',
            default: 5,
            description: 'Maximum conversation turns',
          },
          {
            displayName: 'Verbose',
            name: 'verbose',
            type: 'boolean',
            default: false,
            description: 'Enable verbose output',
          },
          {
            displayName: 'Timeout',
            name: 'timeout',
            type: 'number',
            default: 300,
            description: 'Command timeout in seconds',
          },
          {
            displayName: 'Working Directory',
            name: 'cwd',
            type: 'string',
            default: '',
            description: 'Working directory for command execution',
          },
          {
            displayName: 'Use API Key Override',
            name: 'useApiKeyOverride',
            type: 'boolean',
            default: false,
            description: 'Override credential settings and use API key authentication',
          },
          {
            displayName: 'API Key Override',
            name: 'apiKeyOverride',
            type: 'string',
            typeOptions: {
              password: true,
            },
            default: '',
            description: 'API key to use for this execution only',
            displayOptions: {
              show: {
                useApiKeyOverride: [true],
              },
            },
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('claudeCodeApi').catch(() => ({}));

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const operation = this.getNodeParameter('operation', itemIndex) as string;
        const prompt = this.getNodeParameter('prompt', itemIndex) as string;
        const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
        const additionalOptions = this.getNodeParameter('additionalOptions', itemIndex) as any;

        // Build the command
        let command = 'claude';
        
        // Add -p flag for non-interactive execution
        command += ' -p';

        // Handle different operations
        if (operation === 'continue') {
          command += ' -c';
        }

        // Add the prompt (properly escaped)
        command += ` "${prompt.replace(/"/g, '\\"')}"`;

        // Add project path if specified
        const projectPath = this.getNodeParameter('projectPath', itemIndex, '') as string || 
                          (credentials.projectPath as string) || '';
        if (projectPath) {
          command += ` --project "${projectPath}"`;
        }

        // Add output format for streaming JSON
        if (outputFormat === 'stream-json' || outputFormat === 'structured') {
          command += ' --output-format stream-json';
        }

        // Handle authentication method
        const authMethod = credentials.authMethod || 'browser';
        if (authMethod === 'browser') {
          // Use browser authentication (Claude Pro/Max)
          const browserProfile = credentials.browserProfile || 'default';
          if (browserProfile && browserProfile !== 'default') {
            command += ` --browser-profile "${browserProfile}"`;
          }
          // Ensure we're using browser auth
          command += ' --use-browser';
        }

        // Add model if specified
        const model = additionalOptions.model || credentials.model;
        if (model) {
          command += ` --model ${model}`;
        }

        // Add system prompt if specified
        const systemPrompt = additionalOptions.systemPrompt || credentials.systemPrompt;
        if (systemPrompt) {
          command += ` --system-prompt "${systemPrompt.replace(/"/g, '\\"')}"`;
        }

        // Add allowed tools
        if (additionalOptions.allowedTools && additionalOptions.allowedTools.length > 0) {
          command += ` --allowed-tools ${additionalOptions.allowedTools.join(',')}`;
        }

        // Add max turns
        if (additionalOptions.maxTurns) {
          command += ` --max-turns ${additionalOptions.maxTurns}`;
        }

        // Add verbose flag
        if (additionalOptions.verbose) {
          command += ' --verbose';
        }

        // Build environment variables
        const env = { ...process.env };
        
        // Check for API key override first
        if (additionalOptions.useApiKeyOverride && additionalOptions.apiKeyOverride) {
          env.ANTHROPIC_API_KEY = additionalOptions.apiKeyOverride;
          // Force API key auth when using override
          command = command.replace(' --use-browser', '').replace(/--browser-profile "[^"]*"/, '');
        } else if (authMethod === 'apiKey' && credentials.apiKey) {
          // Handle regular API key authentication
          env.ANTHROPIC_API_KEY = credentials.apiKey as string;
        }
        
        // Add credentials environment variables
        if (credentials.envVars) {
          const envLines = (credentials.envVars as string).split('\n');
          for (const line of envLines) {
            const [key, value] = line.split('=');
            if (key && value) {
              env[key.trim()] = value.trim();
            }
          }
        }

        // Execute the command
        const timeout = (additionalOptions.timeout || 300) * 1000;
        const cwd = additionalOptions.cwd || process.cwd();

        const { stdout, stderr } = await execPromise(command, {
          env,
          cwd,
          timeout,
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });

        // Handle output based on format
        if (outputFormat === 'text') {
          returnData.push({
            json: {
              output: stdout,
              error: stderr,
              command,
            },
            pairedItem: itemIndex,
          });
        } else if (outputFormat === 'stream-json') {
          // Return raw JSONL
          returnData.push({
            json: {
              jsonl: stdout,
              error: stderr,
              command,
            },
            pairedItem: itemIndex,
          });
        } else if (outputFormat === 'structured') {
          // Parse JSONL into structured format
          const messages = stdout
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
              try {
                return JSON.parse(line);
              } catch (error) {
                return { type: 'parse_error', content: line };
              }
            });

          // Extract useful information
          const userMessages = messages.filter(m => m.type === 'user');
          const assistantMessages = messages.filter(m => m.type === 'assistant');
          const toolUses = messages.filter(m => m.type === 'tool_use');
          const result = messages.find(m => m.type === 'result');

          returnData.push({
            json: {
              messages,
              summary: {
                userMessageCount: userMessages.length,
                assistantMessageCount: assistantMessages.length,
                toolUseCount: toolUses.length,
                hasResult: !!result,
              },
              result: result || null,
              error: stderr,
              command,
            },
            pairedItem: itemIndex,
          });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
            },
            pairedItem: itemIndex,
          });
          continue;
        }
        throw new NodeOperationError(
          this.getNode(),
          `Claude Code CLI error: ${error.message}`,
          { itemIndex }
        );
      }
    }

    return [returnData];
  }
}