const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "The request could not be completed.");
    error.status = response.status;
    error.fieldErrors = data.fieldErrors && typeof data.fieldErrors === "object" ? data.fieldErrors : {};
    throw error;
  }
  return data;
}

async function getCsrfToken(signal) {
  const response = await fetch(`${apiBaseUrl}/auth/csrf`, {
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });
  const result = await readJson(response);
  if (!result.csrfToken) throw new Error("Could not start a secure request. Refresh and try again.");
  return result.csrfToken;
}

export async function adminRequest(path, { method = "GET", body, signal } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-CSRF-Token"] = await getCsrfToken(signal);
  try {
    const response = await fetch(`${apiBaseUrl}/admin${path}`, {
      method,
      credentials: "include",
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal,
    });
    return await readJson(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Could not connect to YouthBiz. Check that the API is running and try again.");
    }
    throw error;
  }
}

export async function submitAdminLogin(payload) {
  return adminRequest("/auth/login", { method: "POST", body: payload });
}
