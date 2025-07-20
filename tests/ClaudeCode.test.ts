import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ClaudeCode } from '../nodes/ClaudeCode/ClaudeCode.node';

// Mock the exec function
jest.mock('util', () => ({
  promisify: jest.fn(() => jest.fn()),
}));

describe('ClaudeCode Node', () => {
  let claudeCodeNode: ClaudeCode;
  let mockExecuteFunctions: IExecuteFunctions;

  beforeEach(() => {
    claudeCodeNode = new ClaudeCode();
    
    // Mock IExecuteFunctions
    mockExecuteFunctions = {
      getInputData: jest.fn(() => [{ json: {} }]),
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn(() => Promise.resolve({})),
      getNode: jest.fn(() => ({ name: 'Claude Code', type: 'claudeCode' })),
      continueOnFail: jest.fn(() => false),
    } as unknown as IExecuteFunctions;
  });

  describe('Node Description', () => {
    it('should have correct metadata', () => {
      expect(claudeCodeNode.description.displayName).toBe('Claude Code');
      expect(claudeCodeNode.description.name).toBe('claudeCode');
      expect(claudeCodeNode.description.version).toBe(1);
      expect(claudeCodeNode.description.group).toContain('transform');
    });

    it('should have required properties', () => {
      const properties = claudeCodeNode.description.properties;
      const propertyNames = properties.map(p => p.name);
      
      expect(propertyNames).toContain('operation');
      expect(propertyNames).toContain('prompt');
      expect(propertyNames).toContain('projectPath');
      expect(propertyNames).toContain('outputFormat');
      expect(propertyNames).toContain('additionalOptions');
    });
  });

  describe('Execute Method', () => {
    it('should build correct command for basic query', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn((name: string) => {
        switch (name) {
          case 'operation': return 'query';
          case 'prompt': return 'Test prompt';
          case 'outputFormat': return 'text';
          case 'projectPath': return '';
          case 'additionalOptions': return {};
          default: return undefined;
        }
      });

      // Mock execPromise to return test output
      const execPromise = jest.fn(() => 
        Promise.resolve({ 
          stdout: 'Test output', 
          stderr: '' 
        })
      );
      
      // Mock the promisify function to return our mock
      require('util').promisify.mockReturnValue(execPromise);

      // Execute
      const result = await claudeCodeNode.execute.call(mockExecuteFunctions);

      // Verify command construction
      expect(execPromise).toHaveBeenCalledWith(
        'claude -p "Test prompt"',
        expect.any(Object)
      );
    });

    it('should handle streaming JSON output format', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn((name: string) => {
        switch (name) {
          case 'operation': return 'query';
          case 'prompt': return 'Test prompt';
          case 'outputFormat': return 'stream-json';
          case 'projectPath': return '/test/path';
          case 'additionalOptions': return { model: 'sonnet' };
          default: return undefined;
        }
      });

      const mockJsonl = '{"type":"user","content":"test"}\n{"type":"assistant","content":"response"}';
      const execPromise = jest.fn(() => 
        Promise.resolve({ 
          stdout: mockJsonl, 
          stderr: '' 
        })
      );
      
      require('util').promisify.mockReturnValue(execPromise);

      const result = await claudeCodeNode.execute.call(mockExecuteFunctions);

      // Verify streaming JSON command
      expect(execPromise).toHaveBeenCalledWith(
        'claude -p "Test prompt" --project "/test/path" --output-format stream-json --model sonnet',
        expect.any(Object)
      );

      // Verify output structure
      expect(result[0][0].json).toHaveProperty('jsonl', mockJsonl);
    });

    it('should parse structured output correctly', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn((name: string) => {
        switch (name) {
          case 'operation': return 'query';
          case 'prompt': return 'Test prompt';
          case 'outputFormat': return 'structured';
          case 'projectPath': return '';
          case 'additionalOptions': return {};
          default: return undefined;
        }
      });

      const mockJsonl = [
        '{"type":"user","content":"test"}',
        '{"type":"assistant","content":"response"}',
        '{"type":"tool_use","content":{"tool_name":"Read"}}',
        '{"type":"result","success":true}'
      ].join('\n');

      const execPromise = jest.fn(() => 
        Promise.resolve({ 
          stdout: mockJsonl, 
          stderr: '' 
        })
      );
      
      require('util').promisify.mockReturnValue(execPromise);

      const result = await claudeCodeNode.execute.call(mockExecuteFunctions);
      const output = result[0][0].json;

      // Verify structured parsing
      expect(output.messages).toHaveLength(4);
      expect(output.summary).toEqual({
        userMessageCount: 1,
        assistantMessageCount: 1,
        toolUseCount: 1,
        hasResult: true,
      });
      expect(output.result).toEqual({ type: 'result', success: true });
    });

    it('should handle continue operation', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn((name: string) => {
        switch (name) {
          case 'operation': return 'continue';
          case 'prompt': return 'Continue prompt';
          case 'outputFormat': return 'text';
          case 'projectPath': return '';
          case 'additionalOptions': return {};
          default: return undefined;
        }
      });

      const execPromise = jest.fn(() => 
        Promise.resolve({ 
          stdout: 'Continued output', 
          stderr: '' 
        })
      );
      
      require('util').promisify.mockReturnValue(execPromise);

      await claudeCodeNode.execute.call(mockExecuteFunctions);

      // Verify continue flag is added
      expect(execPromise).toHaveBeenCalledWith(
        'claude -p -c "Continue prompt"',
        expect.any(Object)
      );
    });

    it('should handle errors gracefully', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn((name: string) => {
        switch (name) {
          case 'operation': return 'query';
          case 'prompt': return 'Test prompt';
          case 'outputFormat': return 'text';
          case 'projectPath': return '';
          case 'additionalOptions': return {};
          default: return undefined;
        }
      });

      const execPromise = jest.fn(() => 
        Promise.reject(new Error('Command failed'))
      );
      
      require('util').promisify.mockReturnValue(execPromise);

      // Test with continueOnFail = false
      await expect(claudeCodeNode.execute.call(mockExecuteFunctions))
        .rejects.toThrow('Claude Code CLI error: Command failed');

      // Test with continueOnFail = true
      mockExecuteFunctions.continueOnFail = jest.fn(() => true);
      const result = await claudeCodeNode.execute.call(mockExecuteFunctions);
      
      expect(result[0][0].json).toHaveProperty('error', 'Command failed');
    });
  });
});