/**
 * Main Express Server
 * Serves the chatbot application and API endpoints
 */

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import MCPManager from './src/mcp-manager.js';
import OllamaClient from './src/ollama-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Initialize MCP and Ollama
let mcpManager;
let ollamaClient;
let vulnerabilityMode = true; // true = vulnerable, false = safe

async function initializeServices() {
  try {
    console.log('🚀 Initializing services...');

    // Connect to MCP server
    mcpManager = new MCPManager();
    await mcpManager.connect();

    // Create Ollama client
    ollamaClient = new OllamaClient(mcpManager);

    // Try to fetch available models (no retry - user sees on UI if empty)
    try {
      const models = await ollamaClient.listModels();
      if (models.length > 0) {
        const firstModel = models[0].name;
        ollamaClient.setModel(firstModel);
        console.log(`✅ Initialized with model: ${firstModel}`);
      } else {
        console.log('ℹ️ No models available yet. User will need to pull a model from the UI.');
        ollamaClient.setModel(''); // Clear the default model
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch models during initialization:', err.message);
      ollamaClient.setModel(''); // Clear the default model
    }

    console.log('✅ All services initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    throw error;
  }
}

async function setupRoutes() {
  // Chat routes

  // Server-Sent Events endpoint for real-time progress
  app.post('/api/chat/stream', async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      console.log('🔄 SSE Stream started for message:', message);

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Callback function to send progress updates in real-time
      const onProgress = (update) => {
        console.log('📤 Sending progress:', update);
        res.write(`data: ${JSON.stringify(update)}\n\n`);
      };

      try {
        console.log('🤖 Getting response from Ollama...');
        // Pass vulnerability mode to ollamaClient
        const result = await ollamaClient.chat(message, onProgress, vulnerabilityMode);

        console.log('📤 Sending final response...');
        // Send final response
        res.write(`data: ${JSON.stringify({
          type: 'response',
          response: result.response
        })}\n\n`);

        // Send completion signal
        console.log('✅ Stream complete');
        res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
        res.end();

      } catch (error) {
        console.error('❌ Ollama error:', error);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: error.message
        })}\n\n`);
        res.end();
      }

    } catch (error) {
      console.error('❌ SSE setup error:', error);
      res.status(500).json({ error: 'Failed to start stream' });
    }
  });


  // Get available tools
  app.get('/api/chat/tools', async (req, res) => {
    try {
      const tools = await mcpManager.listTools();
      res.json({ tools });
    } catch (error) {
      console.error('Error fetching tools:', error);
      res.status(500).json({ error: 'Failed to fetch tools' });
    }
  });

  // Get available resources
  app.get('/api/chat/resources', async (req, res) => {
    try {
      const resources = await mcpManager.listResources();
      res.json({ resources });
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  });

  // Get available models
  app.get('/api/models', async (req, res) => {
    try {
      const models = await ollamaClient.listModels();
      res.json({ models });
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  });

  // Get current model
  app.get('/api/models/current', (req, res) => {
    // Return the current model from ollamaClient instance
    res.json({ model: ollamaClient.model });
  });

  // Set current model
  app.post('/api/models/select', (req, res) => {
    try {
      const { model } = req.body;
      if (!model) {
        return res.status(400).json({ error: 'Model name is required' });
      }

      // Update ollama client with new model
      ollamaClient.setModel(model);

      console.log(`✅ Model switched to: ${model}`);
      res.json({ message: `Model switched to ${model}`, model });
    } catch (error) {
      console.error('Error switching model:', error);
      res.status(500).json({ error: 'Failed to switch model' });
    }
  });

  // Health check
  app.get('/api/health', async (req, res) => {
    try {
      const tools = await mcpManager.listTools();
      res.json({
        status: 'healthy',
        mcp: 'connected',
        llm: 'ollama',
        model: ollamaClient.model,
        toolsAvailable: tools.length,
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  });

  // Pull model by name — streams progress via SSE
  app.post('/api/models/pull', async (req, res) => {
    req.setTimeout(0);
    try {
      const { model } = req.body;

      if (!model) {
        return res.status(400).json({ error: 'Model name is required' });
      }

      console.log(`⬇️ Pulling model: ${model}`);

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      await ollamaClient.pullModel(model, (progress) => {
        res.write(`data: ${JSON.stringify({ type: 'progress', ...progress })}\n\n`);
      });

      res.write(`data: ${JSON.stringify({ type: 'complete', message: `${model} pulled successfully` })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error pulling model:', error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Pull failed' })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ success: false, error: 'Failed to pull model' });
      }
    }
  });

  // Delete model by name
  app.delete('/api/models/delete', async (req, res) => {
    try {
      const { model } = req.body;

      if (!model) {
        return res.status(400).json({ error: 'Model name is required' });
      }

      console.log(`🗑️ Deleting model: ${model}`);

      const result = await ollamaClient.deleteModel(model);

      res.json({
        success: true,
        message: `Model ${model} deleted successfully`,
        result
      });
    } catch (error) {
      console.error('Error deleting model:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete model'
      });
    }
  });

  // Get current bot mode (SQLBot or FileBot)
  app.get('/api/bot/mode', (req, res) => {
    const mode = ollamaClient.getSelection();
    res.json({ mode });
  });

  // Set bot mode (SQLBot or FileBot)
  app.post('/api/bot/mode', (req, res) => {
    try {
      const { mode } = req.body;
      if (!mode) {
        return res.status(400).json({ error: 'Mode is required' });
      }

      const success = ollamaClient.setSelection(mode);

      if (!success) {
        return res.status(400).json({
          error: 'Invalid mode. Must be SQLBot or FileBot'
        });
      }

      console.log(`✅ Bot mode switched to: ${mode}`);
      res.json({ message: `Bot mode switched to ${mode}`, mode });
    } catch (error) {
      console.error('Error switching bot mode:', error);
      res.status(500).json({ error: 'Failed to switch bot mode' });
    }
  });

  // Get vulnerability mode
  app.get('/api/vulnerability/mode', (req, res) => {
    res.json({ vulnerabilityMode });
  });

  // Set vulnerability mode
  app.post('/api/vulnerability/mode', async (req, res) => {
    try {
      const { vulnerabilityMode: newMode } = req.body;
      if (typeof newMode !== 'boolean') {
        return res.status(400).json({ error: 'Vulnerability mode must be a boolean' });
      }

      vulnerabilityMode = newMode;
      mcpManager.setVulnerabilityMode(newMode);
      ollamaClient.setVulnerability(newMode);

      // Reconnect MCP server with new vulnerability mode
      console.log(`🔄 Reconnecting MCP server with vulnerability mode: ${newMode ? 'Vulnerable' : 'Safe'}`);
      try {
        await mcpManager.disconnect();
        // Update environment variable before reconnecting
        process.env.VULNERABILITY_MODE = newMode ? 'true' : 'false';
        await mcpManager.connect();
        console.log('✅ MCP server reconnected with new vulnerability mode');
      } catch (error) {
        console.error('⚠️ Error reconnecting MCP server:', error);
        // Continue anyway - server might still work
      }

      console.log(`✅ Vulnerability mode set to: ${newMode ? 'Vulnerable' : 'Safe'}`);
      res.json({
        message: `Vulnerability mode set to ${newMode ? 'Vulnerable' : 'Safe'}`,
        vulnerabilityMode
      });
    } catch (error) {
      console.error('Error setting vulnerability mode:', error);
      res.status(500).json({ error: 'Failed to set vulnerability mode' });
    }
  });

}

// Start server
async function startServer() {
  try {
    // First initialize services
    await initializeServices();

    // Then setup routes
    await setupRoutes();

    // Finally start the server
    app.listen(PORT, () => {
      console.log(`\n🌐 MCP and Backend Servers are running on http://localhost:${PORT}`);
      console.log(`🤖 Using Ollama model: ${ollamaClient.model}`);
      console.log(`\n🌐 You can access the application at http://localhost\n`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await mcpManager.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();