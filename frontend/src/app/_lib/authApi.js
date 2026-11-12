const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api")
  .replace(/\/+$/, "");

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "The request could not be completed.");
    error.fieldErrors = data.fieldErrors && typeof data.fieldErrors === "object"
      ? data.fieldErrors
      : {};
    throw error;
  }
  return data;
}

export async function submitAuth(mode, payload) {
  try {
    const csrfResponse = await fetch(`${apiBaseUrl}/auth/csrf`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    const csrfData = await readJson(csrfResponse);

    if (!csrfData.csrfToken) {
      throw new Error("Could not start a secure session. Please refresh and try again.");
    }

    const response = await fetch(`${apiBaseUrl}/auth/${mode}`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfData.csrfToken,
      },
      body: JSON.stringify(payload),
    });

    return await readJson(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Could not connect to YouthBiz. Check that the API is running and try again.");
    }
    throw error;
  }
}