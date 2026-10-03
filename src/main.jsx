import "./style.css";
import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div>
      <h1>🦊 Fox Little World</h1>
      <p>我们的小世界，正在加载中……</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
