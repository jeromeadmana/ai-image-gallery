const API_URL = import.meta.env.VITE_API_URL;

export async function register({ email, password }) {
  const res = await fetch(`auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch(`auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (res.ok && data?.session?.access_token) {
    localStorage.setItem("token", data.session.access_token);
    localStorage.setItem("refresh_token", data.session.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return { success: true, user: data.user };
  }

  return { success: false, message: data?.message || "Login failed" };
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function getToken() {
  return localStorage.getItem("token");
}
