import React from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export default function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = React.useState("myuser");
  const [password, setPassword] = React.useState("123456");
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
await login(username, password);
nav("/bulk", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", background: "#fff", padding: 20, borderRadius: 12 }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
        <button disabled={loading} type="submit">{loading ? "Signing in..." : "Sign in"}</button>
      </form>
      {error && <div style={{ color: "crimson", marginTop: 10 }}>{error}</div>}
    </div>
  );
}