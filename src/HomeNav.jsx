import React from "react";

// A little paw print that gets "stamped" on whichever tab you're on.
function PawStamp() {
  return (
    <svg className="nav-paw" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12.6c2.6 0 5 2.4 5 4.6 0 1.7-1.3 2.6-2.8 2.6-.9 0-1.4-.4-2.2-.4s-1.3.4-2.2.4C8.3 19.8 7 18.9 7 17.2c0-2.2 2.4-4.6 5-4.6Z" />
      <ellipse cx="5.6" cy="10.4" rx="1.9" ry="2.4" transform="rotate(-24 5.6 10.4)" />
      <ellipse cx="9.4" cy="6.4" rx="2" ry="2.6" transform="rotate(-8 9.4 6.4)" />
      <ellipse cx="14.6" cy="6.4" rx="2" ry="2.6" transform="rotate(8 14.6 6.4)" />
      <ellipse cx="18.4" cy="10.4" rx="1.9" ry="2.4" transform="rotate(24 18.4 10.4)" />
    </svg>
  );
}

const navItems = [
  { id: "home", label: "首页", english: "HOME" },
  { id: "chat-list", label: "聊天", english: "CHAT" },
  { id: "diary", label: "日记", english: "DIARY" },
  { id: "more", label: "更多", english: "MORE" },
];

export default function HomeNav({ active, onOpen }) {
  return (
    <nav className="home-nav">
      {navItems.map((item) => {
        const isActive = item.id === active;
        // only pages that exist can be opened for now
        const canOpen = !isActive && (item.id === "home" || item.id === "chat-list");
        return (
          <button
            key={item.id}
            className={isActive ? "active" : ""}
            onClick={canOpen ? () => onOpen(item.id) : undefined}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
          >
            <span className="nav-mark">{isActive ? <PawStamp /> : <i />}</span>
            <span className="nav-label">{item.label}</span>
            <small>{item.english}</small>
          </button>
        );
      })}
    </nav>
  );
}
