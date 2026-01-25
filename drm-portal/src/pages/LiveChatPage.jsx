import React from "react";
import { io } from "socket.io-client";

const CHAT_BASE = import.meta.env.VITE_CHAT_BASE_URL || "http://localhost:3036";

export default function LiveChatPage() {
  const [socket, setSocket] = React.useState(null);

  // Fixed for demo – not shown in UI
  const room = "room1";
  const username = "admin";

  const [joined, setJoined] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [messages, setMessages] = React.useState([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  // Connect to Socket.IO once
  React.useEffect(() => {
    const s = io(CHAT_BASE);
    setSocket(s);

    s.on("connect", () => {
      console.log("Admin connected to chat server:", s.id);
    });

    s.on("chatMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    s.on("disconnect", () => {
      console.log("Admin disconnected from chat server");
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // Auto-join default room and load history when socket is ready
  React.useEffect(() => {
    if (!socket || joined) return;

    async function join() {
      console.log(`Admin auto-joining room "${room}" as "${username}"`);
      socket.emit("joinRoom", room);
      setJoined(true);
      setMessages([]);
      setLoadingHistory(true);

      try {
        const res = await fetch(`${CHAT_BASE}/api/chat/${encodeURIComponent(room)}`);
        if (res.ok) {
          const history = await res.json();
          setMessages(history);
        }
      } catch (err) {
        console.error("Failed to load admin chat history:", err);
      } finally {
        setLoadingHistory(false);
      }
    }

    join();
  }, [socket, joined]);

  function handleSend() {
    if (!socket || !joined || !message.trim()) return;

    socket.emit("chatMessage", {
      room,
      sender: username,
      message: message.trim(),
    });
    setMessage("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="container">
      <h1>Admin Live Chat</h1>
      <div className="subtitle">
        DRM <b>Admin</b> chat view. Admin is automatically connected to the default conversation.
      </div>

      <div style={{ height: 18 }} />

      {/* Messages + input only */}
      <div className="card">
        <div className="label" style={{ marginBottom: 8 }}>
          Messages
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 10,
            height: 320,
            overflowY: "auto",
            background: "#f9fafb",
            marginBottom: 10,
          }}
        >
          {loadingHistory && <div className="help">Loading history…</div>}

          {!loadingHistory && messages.length === 0 && (
            <div className="help">No messages yet. Start typing…</div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 6,
                textAlign: m.sender === username ? "right" : "left",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 10px",
                  borderRadius: 12,
                  background: m.sender === username ? "#2563eb" : "#e5e7eb",
                  color: m.sender === username ? "#fff" : "#111827",
                  maxWidth: "80%",
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {m.sender || "Unknown"}{" "}
                  {m.timestamp ? `• ${new Date(m.timestamp).toLocaleTimeString()}` : ""}
                </div>
                <div>{m.message}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="row2">
          <div className="field">
            <div className="label">Your Message</div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message and press Enter or click Send..."
            />
          </div>
          <div className="field" style={{ alignItems: "flex-end" }}>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!joined || !message.trim()}
              onClick={handleSend}
            >
              Send
            </button>
            {!joined && (
              <div className="help" style={{ marginTop: 8 }}>
                Connecting to chat…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}