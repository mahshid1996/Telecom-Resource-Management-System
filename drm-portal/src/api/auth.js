import { api, setToken } from "./client";

export async function login(username, password) {
  const data = await api("/api/auth/login", {
    method: "POST",
    body: { username, password },
    auth: false,
  });

  const token = data.accessToken || data.token;
  if (!token) throw new Error("No accessToken returned");
  setToken(token);
  return token;
}