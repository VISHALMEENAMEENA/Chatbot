// src/components/MainLayout.js
import React, { useState } from "react";
import { aiApi } from "../auth"; // ✅ import your aiApi
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import "./MainLayout.css";

const MainLayout = ({ isAuth, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
  if (!inputText.trim()) return;

  const newMessage = {
    id: Date.now(),
    text: inputText,
    isAI: false,
    timestamp: Date.now(),
  };

  setMessages((prev) => [...prev, newMessage]);
  setInputText("");
  setIsSending(true);

  try {
    const response = await fetch("http://localhost:5000/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: inputText }), // ✅ Corrected here
    });

    const data = await response.json();

    const aiMessage = {
      id: Date.now() + 1,
      text: data.response || "AI didn't respond.",
      isAI: true,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, aiMessage]);
  } catch (error) {
    const errorMsg = {
      id: Date.now() + 2,
      text: "Error talking to AI: " + error.message,
      isAI: true,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, errorMsg]);
  } finally {
    setIsSending(false);
  }
};

  return (
    <div className="layout-container">
      <Navbar isAuth={isAuth} onLogout={onLogout} />
      <div className="layout-body">
        <Sidebar />
        <div className="layout-content">
          <ChatWindow messages={messages} />
          <ChatInput
            inputText={inputText}
            setInputText={setInputText}
            handleSend={handleSend}
            isSending={isSending}
          />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
