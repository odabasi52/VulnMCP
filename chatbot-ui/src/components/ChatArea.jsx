import { useEffect, useRef, useState } from 'react';
import Message from './Message';

const ChatArea = ({ messages, onSendMessage, isProcessing, hasModels }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !isProcessing) {
            onSendMessage(input);
            setInput('');
            if (inputRef.current) inputRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleInput = (e) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    return (
        <main className="chat-container">
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <Message key={index} msg={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
                <form id="chatForm" onSubmit={handleSubmit}>
                    <textarea
                        id="messageInput"
                        ref={inputRef}
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message here... (Shift+Enter for new line)"
                        rows="1"
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isProcessing || !input.trim() || !hasModels}
                        title={!hasModels ? "No models available - Pull a model first" : !input.trim() ? "Type a message to send" : "Send message"}
                    >
                        {!isProcessing ? (
                            <span>Send</span>
                        ) : (
                            <span className="loader"></span>
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
};

export default ChatArea;