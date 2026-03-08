import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Header from './components/Header';
import { apiClient } from './services/api';
import './App.css';

const ALL_PULL_MODELS = [
  'llama3:latest',
  'mistral:latest',
  'qwen2.5:latest',
  'deepseek-r1:1.5b'
];

const getGreetingMessage = (mode) => {
  if (mode === 'SQLBot') {
    return "👋 Hello! I'm your SQL Query Bot.\n\nI can help you with:\n• Querying the PostgreSQL database\n• Retrieving user information\n• Accessing database records\n\n⚠️ NOTE: No conversation history is held\nSince no history is maintained between messages, please include the exact database table and what you want to query in each request. For example: \"Query all users from the users table\" or \"Get the department of user with id 1\"\n\nTry asking me: \"Show me all users\" or \"What departments are available?\"";
  } else if (mode === 'FileBot') {
    return "👋 Hello! I'm your File Bot with access to your documents.\n\nI can help you with:\n• Reading documents\n• Listing available files and folders\n• Answering questions based on your documents\n\n⚠️ NOTE: No conversation history is held\nSince no history is maintained between messages, please include the file path and what you want to do in each request. For example: \"Read the FAQ document at data/documents/faq.txt\" or \"List files in data/documents/\"\n\nTry asking me: \"What documents are available in current directory?\" or \"Show me the FAQ document\"";
  } else if (mode === 'HealthCheckBot') {
    return "👋 Hello! I'm your HealthCheck Bot for network diagnostics.\n\nI can help you with:\n• Pinging hosts and servers\n• Checking network connectivity\n• Diagnosing network reachability\n\n⚠️ NOTE: No conversation history is held\nSince no history is maintained between messages, please include the host you want to ping in each request. For example: \"Ping google.com\" or \"Check if 8.8.8.8 is reachable\"\n\nTry asking me: \"Ping google.com\" or \"Check connectivity to example.com\"";
  } else {
    return "👋 Hello! I'm your File Bot with access to your documents.\n\nI can help you with:\n• Reading documents\n• Listing available files and folders\n• Answering questions based on your documents\n\n⚠️ NOTE: No conversation history is held\nSince no history is maintained between messages, please include the file path and what you want to do in each request. For example: \"Read the FAQ document at data/documents/faq.txt\" or \"List files in data/documents/\"\n\nTry asking me: \"What documents are available in current directory?\" or \"Show me the FAQ document\"";
  }
};

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: getGreetingMessage('SQLBot'), type: 'text' }
  ]);
  const [tools, setTools] = useState([]);
  const [models, setModels] = useState([]);
  const [pullableModels, setPullableModels] = useState([]);
  const [currentModel, setCurrentModel] = useState('');
  const [botMode, setBotMode] = useState('SQLBot');
  const [status, setStatus] = useState({ connected: false, text: 'Connecting' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [vulnerabilityMode, setVulnerabilityMode] = useState(true); // true = vulnerable, false = safe

  const refreshModels = async () => {
    const { models = [] } = await apiClient.getAvailableModels();
    setModels(models);

    const installed = models.map(m => m.name);
    setPullableModels(
      ALL_PULL_MODELS.filter(m => !installed.includes(m))
    );

    if ((!currentModel || currentModel === '') && models.length > 0) {
      console.log(`Auto-selecting first available model: ${models[0].name}`);
      await apiClient.setModel(models[0].name);
      setCurrentModel(models[0].name);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const health = await apiClient.checkHealth();
        setStatus({
          connected: true,
          text: `Connected • ${health.toolsAvailable} tools available`
        });

        const { tools } = await apiClient.getTools();
        setTools(tools);

        const { models } = await apiClient.getAvailableModels();
        setModels(models);

        const installed = models.map(m => m.name);
        setPullableModels(
          ALL_PULL_MODELS.filter(m => !installed.includes(m))
        );

        const { model } = await apiClient.getCurrentModel();
        setCurrentModel(model);

        const { mode } = await apiClient.getBotMode();
        setBotMode(mode);

        const { vulnerabilityMode: vMode } = await apiClient.getVulnerabilityMode();
        setVulnerabilityMode(vMode);
      } catch (err) {
        setStatus({ connected: false, text: 'Connection error' });
      }
    };
    init();
  }, []);

  const handleBotModeChange = async (newMode) => {
    try {
      await apiClient.setBotMode(newMode);
      setBotMode(newMode);
      // Update greeting message based on new bot mode
      setMessages([
        { role: 'assistant', content: getGreetingMessage(newMode), type: 'text' }
      ]);
      console.log(`Bot mode changed successfully: ${newMode}`);
    } catch (err) {
      console.error("Error changing bot mode:", err);
      alert("An error occured during changing the bot mode.");
    }
  };

  const handleVulnerabilityModeChange = async (newVulnerabilityMode) => {
    try {
      await apiClient.setVulnerabilityMode(newVulnerabilityMode);
      setVulnerabilityMode(newVulnerabilityMode);
      console.log(`Vulnerability mode changed: ${newVulnerabilityMode ? 'Vulnerable' : 'Safe'}`);
    } catch (err) {
      console.error("Error changing vulnerability mode:", err);
      alert("An error occurred during changing the vulnerability mode.");
    }
  };

  const handleModelChange = async (newModel) => {
    if (!newModel) {
      alert('Please select a valid model');
      return;
    }

    try {
      console.log(`Attempting to set model to: ${newModel}`);
      const response = await apiClient.setModel(newModel);
      console.log('Set model response:', response);

      // Verify the model was set by fetching current model
      const { model: verifyModel } = await apiClient.getCurrentModel();
      console.log(`Verified model after set: ${verifyModel}`);

      setCurrentModel(verifyModel);
      console.log(`✅ Model changed successfully to: ${verifyModel}`);
    } catch (err) {
      console.error("Error changing model:", err);
      alert(`❌ Failed to change model: ${err.message || 'Unknown error'}`);
      // Refresh to show current model
      const { model } = await apiClient.getCurrentModel();
      setCurrentModel(model);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || isProcessing) return;

    if (models.length === 0) {
      alert('❌ No models available. Please pull a model first using the sidebar.');
      return;
    }

    const userMsg = { role: 'user', content: text, type: 'text' };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    const tempAssistantId = Date.now();
    setMessages(prev => [...prev, { id: tempAssistantId, role: 'assistant', content: '', steps: [], type: 'streaming' }]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let currentSteps = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'response') {
              assistantContent = data.response;
            } else if (data.step) {
              const newStepText = `${data.step} ${data.message}`;
              if (!currentSteps.includes(newStepText)) {
                currentSteps = [...currentSteps, newStepText];
              }
            }

            setMessages(prev => prev.map(msg =>
              msg.id === tempAssistantId
                ? { ...msg, content: assistantContent, steps: [...currentSteps] }
                : msg
            ));
          } catch (e) {
            console.error("JSON parse error", e);
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePullModel = async (model, onProgress = null) => {
    await apiClient.pullModel(model, onProgress);
    await refreshModels();
  };

  const handleDeleteModel = async (model) => {
    await apiClient.deleteModel(model);
    await refreshModels();

    if (currentModel === model) {
      setCurrentModel('');
    }
  };

  return (
    <div className="container">
      <Header
        status={status}
        vulnerabilityMode={vulnerabilityMode}
        onVulnerabilityModeChange={handleVulnerabilityModeChange}
      />
      <Sidebar
        tools={tools}
        models={models}
        pullableModels={pullableModels}
        currentModel={currentModel}
        botMode={botMode}
        onBotModeChange={handleBotModeChange}
        onModelChange={handleModelChange}
        onPullModel={handlePullModel}
        onDeleteModel={handleDeleteModel}
        onClear={() => setMessages([messages[0]])}
      />
      <ChatArea
        messages={messages}
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing}
        hasModels={models.length > 0}
      />
    </div>
  );
}

export default App;