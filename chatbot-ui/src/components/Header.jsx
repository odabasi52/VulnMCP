const Header = ({ status, vulnerabilityMode, onVulnerabilityModeChange }) => {
    return (
        <header>
            <div className="header-top">
                <div className="header-title">
                    <h1>VulnMCP</h1>
                    <p className="subtitle">Powered by Ollama & Model Context Protocol</p>
                </div>
                <div className="header-controls">
                    <div className="vulnerability-switch">
                        <label htmlFor="vulnerability-toggle">Mode:</label>
                        <div className="switch-container">
                            <span className={`mode-label ${vulnerabilityMode ? 'active' : ''}`}>Vulnerable</span>
                            <input
                                id="vulnerability-toggle"
                                type="checkbox"
                                checked={!vulnerabilityMode}
                                onChange={(e) => onVulnerabilityModeChange(!e.target.checked)}
                                className="toggle-switch"
                            />
                            <span className={`mode-label ${!vulnerabilityMode ? 'active' : ''}`}>Safe</span>
                        </div>
                    </div>

                    <div className="vulnerability-switch" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                        <label>PromptWAF:</label>
                        <div className="switch-container">
                            <span className="mode-label active">Disabled</span>
                            <input
                                type="checkbox"
                                checked={false}
                                disabled
                                className="toggle-switch"
                            />
                            <span className="mode-label" style={{ fontStyle: 'italic', fontSize: '0.85em' }}>Coming Soon…</span>
                        </div>
                    </div>

                    <div className="status">
                        <span
                            className={`status-indicator ${status.connected ? 'connected' : ''}`}
                        ></span>
                        <span>{status.text}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;