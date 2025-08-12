import React, { useState, useEffect } from "react";
import "./Sidebar.css";

const Sidebar = ({ chats = [], onSelectChat, activeChatId }) => {
  // Open by default on desktop, closed on mobile
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);

  // Update on resize to toggle automatically for better UX
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

/*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Toggle the sidebar open/closed state. If the sidebar is open and the window
   * width is less than 768px, it will be closed after selection.

/*******  e38c9125-2109-4232-acc2-deb48e38f7ba *******/
  const toggleSidebar = () => {
    setIsOpen((open) => !open);
  };

  const handleSelectChat = (id) => {
    onSelectChat && onSelectChat(id);
    if (window.innerWidth < 768) {
      setIsOpen(false); // auto close sidebar on mobile after selection
    }
  };

  return (
    <>
      <button
        id="sidebar-toggle"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        onClick={toggleSidebar}
        aria-expanded={isOpen}
        className={isOpen ? "open" : "closed"}
      >
        ☰
      </button>
      
      <aside className={`sidebar ${isOpen ? "open" : "closed"}`} aria-hidden={!isOpen}>
        <button
          className="sidebar-close-btn"
          aria-label="Close sidebar"
          onClick={toggleSidebar}
        >
          
        </button>

        <h2>History</h2>
        {chats.length === 0 ? (
          <p className="empty-message">No chats yet</p>
        ) : (
          <ul className="chat-list">
            {chats.map((chat) => (
              <li
                
                key={chat.id}
                className={chat.id === activeChatId ? "chat-item active" : "chat-item"}
                onClick={() => handleSelectChat(chat.id)}
                title={chat.title}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (["Enter", " "].includes(e.key)) {
                    e.preventDefault();
                    handleSelectChat(chat.id);
                  }
                }}
              >
                {chat.title}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
