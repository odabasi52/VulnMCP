const Message = ({ msg }) => {
    const formatContent = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => (
            <span key={i}>
                {line.split('**').map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
                <br />
            </span>
        ));
    };

    return (
        <div className={`message ${msg.role}`}>
            <div className="message-content">
                {!msg.content && msg.steps && msg.steps.length > 0 && (
                    <div className="steps-container">
                        {msg.steps.map((step, index) => (
                            <div key={index} className="progress-step">
                                {step}
                            </div>
                        ))}
                    </div>
                )}

                {msg.content && (
                    <div
                        key="assistant-response"
                        className="main-response"
                    >
                        {formatContent(msg.content)}
                    </div>
                )}

                {msg.role === 'assistant' && !msg.content && (!msg.steps || msg.steps.length === 0) && (
                    <span className="loader"></span>
                )}
            </div>
        </div>
    );
};

export default Message;