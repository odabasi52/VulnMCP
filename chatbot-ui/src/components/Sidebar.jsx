import { useState } from 'react';

const Sidebar = ({
  tools,
  models,
  pullableModels,
  currentModel,
  botMode,
  onBotModeChange,
  onModelChange,
  onClear,
  onPullModel,
  onDeleteModel
}) => {
  const [pullModel, setPullModel] = useState('');
  const [deleteModel, setDeleteModel] = useState('');
  const [pullStatus, setPullStatus] = useState('');
  const [pullProgress, setPullProgress] = useState(null); // { percent, status }
  const [isPulling, setIsPulling] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState('');

  const handlePull = async () => {
    if (!pullModel) return;
    setIsPulling(true);
    setPullProgress({ percent: 0, status: 'Starting...' });
    setPullStatus('');
    try {
      await onPullModel(pullModel, (data) => {
        if (data.type === 'progress') {
          const percent = data.total > 0
            ? Math.round((data.completed / data.total) * 100)
            : null;
          setPullProgress({
            percent,
            status: data.status || 'Downloading...',
          });
        } else if (data.type === 'complete') {
          setPullProgress({ percent: 100, status: 'Complete!' });
        }
      });
      setPullStatus(`✅ ${pullModel} pulled successfully`);
      setPullModel('');
    } catch {
      setPullStatus('❌ Pull failed');
    } finally {
      setIsPulling(false);
      setTimeout(() => setPullProgress(null), 2000);
    }
  };

  const handleDelete = async () => {
    if (!deleteModel) return;

    if (!window.confirm(`⚠️ Are you sure you want to delete "${deleteModel}"?`)) {
      return;
    }

    setDeleteStatus(`🗑️ Deleting ${deleteModel}...`);
    try {
      await onDeleteModel(deleteModel);
      setDeleteStatus(`✅ ${deleteModel} deleted`);
      setDeleteModel('');
    } catch {
      setDeleteStatus('❌ Delete failed');
    }
  };

  // Filter tools based on bot mode
  const filteredTools = tools.filter(tool => {
    if (botMode === 'SQLBot') {
      return tool.name === 'query_sql';
    } else if (botMode === 'FileBot') {
      return tool.name === 'read_document' || tool.name === 'list_documents';
    } else if (botMode === 'HealthCheckBot') {
      return tool.name === 'health_check';
    }
    return true;
  });

  return (
    <div className="sidebar">
      <div className="bot-mode-section">
        <h3>Bot Mode</h3>
        <select
          className="model-select"
          value={botMode}
          onChange={(e) => onBotModeChange(e.target.value)}
        >
          <option value="SQLBot">SQLBot (Database Queries)</option>
          <option value="FileBot">FileBot (Document Access)</option>
          <option value="HealthCheckBot">HealthCheckBot (Network Ping)</option>
        </select>
        <p className="current-model">Current: {botMode}</p>
      </div>

      <div className="tools-section">
        <h3>Available Tools</h3>
        <div className="tools-list">
          {filteredTools.length ? filteredTools.map((tool, i) => (
            <div key={i} className="tool-item">
              <div className="tool-name">🔧 {tool.name}</div>
              <div className="tool-description">{tool.description}</div>
            </div>
          )) : <p className="loading">No tools available</p>}
        </div>
      </div>

      <div className="model-selector-section">
        <h3>Ollama Models</h3>
        <select
          className="model-select"
          value={currentModel || ''}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={models.length === 0}
        >
          {models.length === 0 ? (
            <option value="" disabled>No models available</option>
          ) : (
            <>
              {!currentModel && <option value="">Select a model...</option>}
              {models.map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </>
          )}
        </select>
        <p className="current-model">Current: {currentModel || '❌ No model selected'}</p>

        <div className="model-pull-section">
          <h3>Pull Model</h3>
          <select
            className="model-select"
            value={pullModel}
            onChange={(e) => setPullModel(e.target.value)}
          >
            {pullableModels.length === 0 ? (
              <option disabled>All models already installed</option>
            ) : (
              <>
                <option value="">Select model to pull</option>
                {pullableModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </>
            )}
          </select>

          <button className="btn btn-secondary" onClick={handlePull} disabled={!pullModel || isPulling}>
            {isPulling ? 'Pulling...' : 'Pull Model'}
          </button>

          {pullProgress && (
            <div className="pull-progress">
              <div className="pull-progress-bar">
                <div
                  className="pull-progress-fill"
                  style={{ width: `${pullProgress.percent ?? 0}%` }}
                />
              </div>
              <p className="pull-progress-text">
                {pullProgress.percent != null ? `${pullProgress.percent}%` : ''} {pullProgress.status}
              </p>
            </div>
          )}

          <p className="current-model">{pullStatus}</p>
        </div>

        <div className="model-delete-section">
          <h3>Delete Model</h3>
          <select
            className="model-select"
            value={deleteModel}
            onChange={(e) => setDeleteModel(e.target.value)}
          >
            {models.length === 0 ? (
              <option disabled>No models installed</option>
            ) : (
              <>
                <option value="">Select model to delete</option>
                {models.map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </>
            )}
          </select>

          <button className="btn btn-secondary" onClick={handleDelete} disabled={!deleteModel}>
            Delete Model
          </button>

          <p className="current-model">{deleteStatus}</p>
        </div>
      </div>

      <button onClick={onClear} className="btn btn-secondary">
        Clear Chat
      </button>
    </div>
  );
};

export default Sidebar;