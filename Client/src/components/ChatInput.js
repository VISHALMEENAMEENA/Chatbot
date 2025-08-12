import React from "react";
import "./ChatInput.css";

const ChatInput = ({ inputText = "", setInputText, handleSend, isSending }) => {
  const textareaRef = React.useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim() && !isSending) {
        handleSend();
      }
    }
  };

  const handleChange = (e) => {
    setInputText(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  };

  return (
    <div className="input-area">
      <textarea
        ref={textareaRef}
        placeholder={isSending ? "Generating response..." : "Type your prompt..."}
        value={inputText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows="1"
        disabled={isSending}
      />
      <button
        onClick={handleSend}
        disabled={isSending || !inputText.trim()}
        aria-busy={isSending}
      >
        {isSending ? <span className="spinner"></span> : <span>Send</span>}
      </button>
    </div>
  );
};

export default ChatInput;
