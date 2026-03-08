/**
 * MCP Server Manager
 * Manages the connection to the Python MCP server
 */


import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPManager {
  constructor() {
    this.client = null;
    this.transport = null;
    this.serverProcess = null;
    this.vulnerabilityMode = true; // true = vulnerable, false = safe
  }

  setVulnerabilityMode(mode) {
    this.vulnerabilityMode = mode;
    console.log(`🎯 MCP Vulnerability Mode set to: ${mode ? 'Vulnerable' : 'Safe'}`);
  }

  getVulnerabilityMode() {
    return this.vulnerabilityMode;
  }

  async connect() {
    try {
      console.log('🔌 Connecting to MCP server...');

      const mcpServerPath = path.join(__dirname, '../../mcp-server');
      const pythonPath = 'python3';
      const serverScript = path.join(mcpServerPath, 'server.py');

      console.log(`🐍 Using Python: ${pythonPath}`);
      console.log(`📄 Server script: ${serverScript}`);

      // Create transport with stdio
      this.transport = new StdioClientTransport({
        command: pythonPath,
        args: [serverScript],
        env: process.env,
      });

      console.log('⏳ Creating MCP client...');
      // Create MCP client
      this.client = new Client({
        name: 'mcp-chatbot-client',
        version: '1.0.0',
      }, {
        capabilities: {
          roots: {
            listChanged: true
          },
        },
      });

      console.log('⏳ Connecting to transport...');
      // Connect to server
      await this.client.connect(this.transport);

      console.log('✅ Successfully connected to MCP server');
      console.log('🎉 MCP server is now active and ready!');

      return true;
    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error);
      throw error;
    }
  }

  async listTools() {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.listTools();
      return response.tools || [];
    } catch (error) {
      console.error('Error listing tools:', error);
      return [];
    }
  }

  async listResources() {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.listResources();
      return response.resources || [];
    } catch (error) {
      console.error('Error listing resources:', error);
      return [];
    }
  }

  async callTool(name, args) {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      console.log(`🔧 Calling tool: ${name}`, args);
      const response = await this.client.callTool({ name, arguments: args });
      return response;
    } catch (error) {
      console.error(`Error calling tool ${name}:`, error);
      throw error;
    }
  }

  async readResource(uri) {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      console.log(`📖 Reading resource: ${uri}`);
      const response = await this.client.readResource({ uri });
      return response;
    } catch (error) {
      console.error(`Error reading resource ${uri}:`, error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.close();
        console.log('🔌 Disconnected from MCP server');
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    }
  }
}

export default MCPManager;