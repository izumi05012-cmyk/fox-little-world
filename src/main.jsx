import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

import Chat from "./Chat";
import ChatList from "./ChatList";
import Splash from "./Splash";
import JournalHome from "./JournalHome";
import "@fontsource/noto-serif-sc/300.css";
import "@fontsource/noto-serif-sc/400.css";
import "@fontsource/long-cang/400.css";

// Day 1 is the day we got together.
const TOGETHER_SINCE = new Date(2026, 9, 3);
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
}

// Monthly anniversaries on the 3rd, plus every 100 days and each full year.
function nextSpecialDay(today) {
  const candidates = [];
  for (let m = 1; m <= 24; m += 1) {
    const date = new Date(TOGETHER_SINCE.getFullYear(), TOGETHER_SINCE.getMonth() + m, 3);
    const label = m % 12 === 0 ? `${m / 12} 周年` : `${m} 个月纪念日`;
    candidates.push({ date, label });
  }
  for (let n = 100; n <= 1000; n += 100) {
    candidates.push({ date: new Date(TOGETHER_SINCE.getTime() + (n - 1) * DAY_MS), label: `在一起 ${n} 天` });
  }
  return candidates
    .map((c) => ({ ...c, days: daysBetween(today, c.date) }))
    .filter((c) => c.days >= 0)
    .sort((a, b) => a.days - b.days)[0];
}

function Home({ onOpen }) {
  const today = new Date();
  return (
    <JournalHome
      today={today}
      dayCount={daysBetween(TOGETHER_SINCE, today) + 1}
      next={nextSpecialDay(today)}
      onOpen={onOpen}
    />
  );
}

function App() {
  const [page, setPage] = useState("home");

  if (page === "chat") {
    return <Chat onBack={() => setPage("chat-list")} />;
  }

  if (page === "chat-list") {
    return (
      <ChatList
        onBack={() => setPage("home")}
        onOpenChat={() => setPage("chat")}
        onNavigate={setPage}
      />
    );
  }

  return (
    <>
      <Splash />
      <Home onOpen={setPage} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
