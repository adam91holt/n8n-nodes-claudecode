import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { query, type SDKMessage } from '@anthropic-ai/claude-code';

export class ClaudeCode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Claude Code',
    name: 'claudeCode',
    icon: 'file:claudecode.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["prompt"]}}',
    description: 'Execute Claude Code SDK with streaming support',
    defaults: {
      name: 'Claude Code',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Query',
            value: 'query',
            description: 'Send a query to Claude Code',
          },
          {
            name: 'Continue',
            value: 'continue',
            description: 'Continue the previous conversation',
          },
        ],
        default: 'query',
        description: 'The operation to perform',
      },
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        default: '',
        description: 'The prompt to send to Claude Code',
        required: true,
      },
      {
        displayName: 'Output Format',
        name: 'outputFormat',
        type: 'options',
        options: [
          {
            name: 'Structured',
            value: 'structured',
            description: 'Parse output into structured format',
          },
          {
            name: 'Messages',
            value: 'messages',
            description: 'Return raw messages array',
          },
          {
            name: 'Text',
            value: 'text',
            description: 'Return final result text only',
          },
        ],
        default: 'structured',
        description: 'How to format the output',
      },
      {
        displayName: 'Project Path',
        name: 'projectPath',
        type: 'string',
        default: '',
        description: 'Path to the project directory (optional)',
        placeholder: '/path/to/project',
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
                name: 'Sonnet',
                value: 'sonnet',
              },
              {
                name: 'Opus',
                value: 'opus',
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
            description: 'System prompt to provide context',
          },
          {
            displayName: 'Allowed Tools',
            name: 'allowedTools',
            type: 'multiOptions',
            options: [
              { name: 'Task', value: 'Task' },
              { name: 'Bash', value: 'Bash' },
              { name: 'Glob', value: 'Glob' },
              { name: 'Grep', value: 'Grep' },
              { name: 'LS', value: 'LS' },
              { name: 'Read', value: 'Read' },
              { name: 'Edit', value: 'Edit' },
              { name: 'MultiEdit', value: 'MultiEdit' },
              { name: 'Write', value: 'Write' },
              { name: 'NotebookRead', value: 'NotebookRead' },
              { name: 'NotebookEdit', value: 'NotebookEdit' },
              { name: 'WebFetch', value: 'WebFetch' },
              { name: 'TodoWrite', value: 'TodoWrite' },
              { name: 'WebSearch', value: 'WebSearch' },
            ],
            default: [],
            description: 'Which tools Claude can use',
          },
          {
            displayName: 'Max Turns',
            name: 'maxTurns',
            type: 'number',
            default: 5,
            description: 'Maximum conversation turns',
          },
          {
            displayName: 'Require Permissions',
            name: 'requirePermissions',
            type: 'boolean',
            default: false,
            description: 'Whether to require permission for tool use',
          },
          {
            displayName: 'Timeout',
            name: 'timeout',
            type: 'number',
            default: 300,
            description: 'Timeout in seconds',
          },
          {
            displayName: 'Debug Mode',
            name: 'debug',
            type: 'boolean',
            default: false,
            description: 'Enable debug logging',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const operation = this.getNodeParameter('operation', itemIndex) as string;
        const prompt = this.getNodeParameter('prompt', itemIndex) as string;
        const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
        const projectPath = this.getNodeParameter('projectPath', itemIndex, '') as string;
        const additionalOptions = this.getNodeParameter('additionalOptions', itemIndex) as any;

        // Create abort controller for timeout
        const abortController = new AbortController();
        const timeout = (additionalOptions.timeout || 300) * 1000;
        const timeoutId = setTimeout(() => abortController.abort(), timeout);

        // Log start
        if (additionalOptions.debug) {
          console.log(`[ClaudeCode] Starting execution for item ${itemIndex}`);
          console.log(`[ClaudeCode] Prompt: ${prompt.substring(0, 100)}...`);
          console.log(`[ClaudeCode] Model: ${additionalOptions.model || 'sonnet'}`);
        }

        // Build query options
        const queryOptions: any = {
          prompt,
          abortController,
          options: {
            maxTurns: additionalOptions.maxTurns || 5,
            permissionMode: additionalOptions.requirePermissions ? 'default' : 'bypassPermissions',
            model: additionalOptions.model || 'sonnet',
          },
        };

        // Add optional parameters
        if (projectPath) {
          queryOptions.options.projectPath = projectPath;
        }
        
        if (additionalOptions.systemPrompt) {
          queryOptions.options.systemPrompt = additionalOptions.systemPrompt;
        }

        if (additionalOptions.allowedTools && additionalOptions.allowedTools.length > 0) {
          queryOptions.options.allowedTools = additionalOptions.allowedTools;
        }

        // Add continue flag if needed
        if (operation === 'continue') {
          queryOptions.options.continue = true;
        }

        // Execute query
        const messages: SDKMessage[] = [];
        const startTime = Date.now();

        try {
          for await (const message of query(queryOptions)) {
            messages.push(message);
            
            if (additionalOptions.debug) {
              console.log(`[ClaudeCode] Received message type: ${message.type}`);
            }

            // Track progress
            if (message.type === 'assistant' && message.message?.content) {
              const content = message.message.content[0];
              if (additionalOptions.debug && content.type === 'text') {
                console.log(`[ClaudeCode] Assistant: ${content.text.substring(0, 100)}...`);
              }
            }
          }

          clearTimeout(timeoutId);
          
          const duration = Date.now() - startTime;
          if (additionalOptions.debug) {
            console.log(`[ClaudeCode] Execution completed in ${duration}ms with ${messages.length} messages`);
          }

          // Format output based on selected format
          if (outputFormat === 'text') {
            // Find the result message
            const resultMessage = messages.find(m => m.type === 'result') as any;
            returnData.push({
              json: {
                result: resultMessage?.result || resultMessage?.error || '',
                success: resultMessage?.subtype === 'success',
                duration_ms: resultMessage?.duration_ms,
                total_cost_usd: resultMessage?.total_cost_usd,
              },
              pairedItem: itemIndex,
            });
          } else if (outputFormat === 'messages') {
            // Return raw messages
            returnData.push({
              json: {
                messages,
                messageCount: messages.length,
              },
              pairedItem: itemIndex,
            });
          } else if (outputFormat === 'structured') {
            // Parse into structured format
            const userMessages = messages.filter((m: any) => m.type === 'user');
            const assistantMessages = messages.filter((m: any) => m.type === 'assistant');
            const toolUses = messages.filter((m: any) => 
              m.type === 'assistant' && 
              m.message?.content?.[0]?.type === 'tool_use'
            );
            const resultMessage = messages.find((m: any) => m.type === 'result') as any;

            returnData.push({
              json: {
                messages,
                summary: {
                  userMessageCount: userMessages.length,
                  assistantMessageCount: assistantMessages.length,
                  toolUseCount: toolUses.length,
                  hasResult: !!resultMessage,
                },
                result: resultMessage?.result || resultMessage?.error || null,
                metrics: resultMessage ? {
                  duration_ms: resultMessage.duration_ms,
                  num_turns: resultMessage.num_turns,
                  total_cost_usd: resultMessage.total_cost_usd,
                  usage: resultMessage.usage,
                } : null,
                success: resultMessage?.subtype === 'success',
              },
              pairedItem: itemIndex,
            });
          }
        } catch (queryError: any) {
          clearTimeout(timeoutId);
          throw queryError;
        }
      } catch (error) {
        console.error(`[ClaudeCode] Error processing item ${itemIndex}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: errorMessage,
              errorDetails: error instanceof Error ? error.stack : undefined,
            },
            pairedItem: itemIndex,
          });
          continue;
        }
        throw new NodeOperationError(
          this.getNode(),
          `Claude Code SDK error: ${errorMessage}`,
          { 
            itemIndex,
            description: errorMessage
          }
        );
      }
    }

    return [returnData];
  }
}