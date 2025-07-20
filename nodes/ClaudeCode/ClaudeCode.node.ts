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
    description: 'Execute Claude Code SDK with streaming support and MCP',
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
        description: 'Claude model to use',
      },
      {
        displayName: 'Max Turns',
        name: 'maxTurns',
        type: 'number',
        default: 5,
        description: 'Maximum conversation turns',
      },
      {
        displayName: 'Timeout',
        name: 'timeout',
        type: 'number',
        default: 300,
        description: 'Timeout in seconds',
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
        displayName: 'Allowed Tools',
        name: 'allowedTools',
        type: 'multiOptions',
        options: [
          // Built-in Claude Code tools
          { name: 'Task', value: 'Task', description: 'Launch agents for complex searches' },
          { name: 'Bash', value: 'Bash', description: 'Execute bash commands' },
          { name: 'Glob', value: 'Glob', description: 'Find files by pattern' },
          { name: 'Grep', value: 'Grep', description: 'Search file contents' },
          { name: 'LS', value: 'LS', description: 'List directory contents' },
          { name: 'Exit Plan Mode', value: 'exit_plan_mode', description: 'Exit planning mode' },
          { name: 'Read', value: 'Read', description: 'Read file contents' },
          { name: 'Edit', value: 'Edit', description: 'Edit files' },
          { name: 'MultiEdit', value: 'MultiEdit', description: 'Make multiple edits' },
          { name: 'Write', value: 'Write', description: 'Write files' },
          { name: 'Notebook Read', value: 'NotebookRead', description: 'Read Jupyter notebooks' },
          { name: 'Notebook Edit', value: 'NotebookEdit', description: 'Edit Jupyter notebooks' },
          { name: 'Web Fetch', value: 'WebFetch', description: 'Fetch web content' },
          { name: 'Todo Write', value: 'TodoWrite', description: 'Manage todo lists' },
          { name: 'Web Search', value: 'WebSearch', description: 'Search the web' },
        ],
        default: ['WebFetch', 'TodoWrite', 'WebSearch', 'exit_plan_mode', 'Task'],
        description: 'Which built-in tools Claude can use',
      },
      {
        displayName: 'MCP Servers',
        name: 'mcpServers',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        placeholder: 'Add MCP Server',
        options: [
          {
            name: 'server',
            displayName: 'MCP Server',
            values: [
              {
                displayName: 'Server Name',
                name: 'name',
                type: 'string',
                default: '',
                description: 'Unique name for this MCP server',
                required: true,
              },
              {
                displayName: 'Command',
                name: 'command',
                type: 'string',
                default: 'npx',
                description: 'Command to run the MCP server',
                required: true,
              },
              {
                displayName: 'Arguments',
                name: 'args',
                type: 'string',
                default: '',
                description: 'Arguments for the command (comma-separated)',
                placeholder: '-y,@modelcontextprotocol/server-filesystem,/path',
              },
              {
                displayName: 'Environment Variables',
                name: 'env',
                type: 'string',
                typeOptions: {
                  rows: 3,
                },
                default: '',
                description: 'Environment variables (KEY=value format, one per line)',
                placeholder: 'GITHUB_TOKEN=your-token\nAPI_KEY=your-key',
              },
              {
                displayName: 'Allowed MCP Tools',
                name: 'allowedMcpTools',
                type: 'string',
                default: '*',
                description: 'Comma-separated list of allowed tools from this server (* for all)',
                placeholder: 'read_file,write_file or * for all',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Additional Options',
        name: 'additionalOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
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
            displayName: 'Require Permissions',
            name: 'requirePermissions',
            type: 'boolean',
            default: false,
            description: 'Whether to require permission for tool use',
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
        const model = this.getNodeParameter('model', itemIndex) as string;
        const maxTurns = this.getNodeParameter('maxTurns', itemIndex) as number;
        const timeout = this.getNodeParameter('timeout', itemIndex) as number;
        const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
        const allowedTools = this.getNodeParameter('allowedTools', itemIndex, []) as string[];
        const mcpServers = this.getNodeParameter('mcpServers', itemIndex, {}) as any;
        const additionalOptions = this.getNodeParameter('additionalOptions', itemIndex) as any;

        // Create abort controller for timeout
        const abortController = new AbortController();
        const timeoutMs = timeout * 1000;
        const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

        // Log start
        if (additionalOptions.debug) {
          console.log(`[ClaudeCode] Starting execution for item ${itemIndex}`);
          console.log(`[ClaudeCode] Prompt: ${prompt.substring(0, 100)}...`);
          console.log(`[ClaudeCode] Model: ${model}`);
          console.log(`[ClaudeCode] Max turns: ${maxTurns}`);
          console.log(`[ClaudeCode] Timeout: ${timeout}s`);
          console.log(`[ClaudeCode] Allowed built-in tools: ${allowedTools.join(', ')}`);
        }

        // Build query options
        const queryOptions: any = {
          prompt,
          abortController,
          options: {
            maxTurns,
            permissionMode: additionalOptions.requirePermissions ? 'default' : 'bypassPermissions',
            model,
          },
        };

        // Add optional parameters
        if (additionalOptions.systemPrompt) {
          queryOptions.options.systemPrompt = additionalOptions.systemPrompt;
        }

        // Process allowed tools - start with built-in tools
        const finalAllowedTools = [...allowedTools];

        // Process MCP servers
        if (mcpServers.server && mcpServers.server.length > 0) {
          const mcpConfig: any = {};
          
          for (const serverConfig of mcpServers.server) {
            if (!serverConfig.name || !serverConfig.command) {
              if (additionalOptions.debug) {
                console.log(`[ClaudeCode] Skipping MCP server with missing name or command:`, serverConfig);
              }
              continue;
            }

            // Build server configuration
            const server: any = {
              command: serverConfig.command,
              args: serverConfig.args 
                ? serverConfig.args.split(',').map((arg: string) => arg.trim()).filter((arg: string) => arg.length > 0) 
                : [],
            };
            
            if (additionalOptions.debug) {
              console.log(`[ClaudeCode] Configuring MCP server "${serverConfig.name}":`, {
                command: server.command,
                args: server.args,
                hasEnv: !!serverConfig.env
              });
            }

            // Add environment variables if specified
            if (serverConfig.env) {
              const envVars: any = {};
              const envLines = serverConfig.env.split('\n').filter((line: string) => line.trim().length > 0);
              
              for (const line of envLines) {
                const equalIndex = line.indexOf('=');
                if (equalIndex > 0) {
                  const key = line.substring(0, equalIndex).trim();
                  let value = line.substring(equalIndex + 1).trim();
                  
                  // Replace environment variable tokens like ${GITHUB_TOKEN} with actual values
                  value = value.replace(/\$\{([^}]+)\}/g, (match: string, envVar: string) => {
                    const replacement = process.env[envVar];
                    if (additionalOptions.debug && !replacement) {
                      console.log(`[ClaudeCode] Warning: Environment variable ${envVar} not found`);
                    }
                    return replacement || match;
                  });
                  
                  // Also support $VARNAME format
                  value = value.replace(/\$([A-Z_][A-Z0-9_]*)/g, (match: string, envVar: string) => {
                    const replacement = process.env[envVar];
                    if (additionalOptions.debug && !replacement) {
                      console.log(`[ClaudeCode] Warning: Environment variable ${envVar} not found`);
                    }
                    return replacement || match;
                  });
                  
                  envVars[key] = value;
                  
                  if (additionalOptions.debug) {
                    console.log(`[ClaudeCode] MCP server "${serverConfig.name}" env: ${key}=${value.substring(0, 10)}...`);
                  }
                }
              }
              
              if (Object.keys(envVars).length > 0) {
                server.env = envVars;
              }
            }

            mcpConfig[serverConfig.name] = server;

            // Add allowed MCP tools
            if (serverConfig.allowedMcpTools === '*') {
              // Allow all tools from this server
              finalAllowedTools.push(`mcp__${serverConfig.name}`);
            } else if (serverConfig.allowedMcpTools) {
              // Add specific tools
              const tools = serverConfig.allowedMcpTools.split(',').map((t: string) => t.trim());
              for (const tool of tools) {
                if (tool) {
                  finalAllowedTools.push(`mcp__${serverConfig.name}__${tool}`);
                }
              }
            }
          }

          // Set MCP servers in options
          if (Object.keys(mcpConfig).length > 0) {
            queryOptions.options.mcpServers = mcpConfig;
            if (additionalOptions.debug) {
              console.log(`[ClaudeCode] MCP servers configured:`, JSON.stringify(mcpConfig, null, 2));
            }
          }
        }

        // Set allowed tools if any are specified
        if (finalAllowedTools.length > 0) {
          queryOptions.options.allowedTools = finalAllowedTools;
          if (additionalOptions.debug) {
            console.log(`[ClaudeCode] Final allowed tools: ${finalAllowedTools.join(', ')}`);
          }
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
              
              // Log MCP server initialization
              if (message.type === 'system' && message.subtype === 'init' && message.mcp_servers) {
                console.log(`[ClaudeCode] MCP servers initialized:`, message.mcp_servers);
              }
            }

            // Track progress
            if (message.type === 'assistant' && message.message?.content) {
              const content = message.message.content[0];
              if (additionalOptions.debug && content.type === 'text') {
                console.log(`[ClaudeCode] Assistant: ${content.text.substring(0, 100)}...`);
              } else if (additionalOptions.debug && content.type === 'tool_use') {
                console.log(`[ClaudeCode] Tool use: ${content.name}`);
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
            const systemInit = messages.find((m: any) => m.type === 'system' && m.subtype === 'init') as any;
            const resultMessage = messages.find((m: any) => m.type === 'result') as any;

            returnData.push({
              json: {
                messages,
                summary: {
                  userMessageCount: userMessages.length,
                  assistantMessageCount: assistantMessages.length,
                  toolUseCount: toolUses.length,
                  hasResult: !!resultMessage,
                  mcpServersLoaded: systemInit?.mcp_servers || [],
                  toolsAvailable: systemInit?.tools || [],
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