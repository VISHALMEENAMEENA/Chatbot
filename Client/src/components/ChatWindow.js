import React, { useEffect, useRef } from "react";
import "./ChatWindow.css";

const Message = ({ message }) => {
  const isError = message.isError;
  const isTyping = message.typing;

  return (
    <div className={`message ${message.isAI ? "ai" : "user"} ${isError ? "error" : ""}`}>
      <div className="message-content">
        {isTyping ? (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : (
          message.text
        )}
      </div>
      {!isTyping && !isError && (
        <div className="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
};

const ChatWindow = ({ messages = [] }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <section className="chat-window" ref={containerRef}>
      <div className="messages">
        {(messages || []).map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} className="scroll-anchor" />
      </div>
    </section>
  );
};

export default ChatWindow;
