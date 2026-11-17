const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api")
  .replace(/\/+$/, "");

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "The request could not be completed.");
    error.status = response.status;
    error.fieldErrors = data.fieldErrors && typeof data.fieldErrors === "object"
      ? data.fieldErrors
      : {};
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
  const data = await readJson(response);
  if (!data.csrfToken) throw new Error("Could not start a secure request. Refresh and try again.");
  return data.csrfToken;
}

export async function dashboardRequest(path, { method = "GET", body, signal } = {}) {
  try {
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (method !== "GET") headers["X-CSRF-Token"] = await getCsrfToken(signal);

    const response = await fetch(`${apiBaseUrl}${path}`, {
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

export async function loadDashboard(signal) {
  const [identity, products, inventory, pitches] = await Promise.all([
    dashboardRequest("/auth/me", { signal }),
    dashboardRequest("/products", { signal }),
    dashboardRequest("/inventory", { signal }),
    dashboardRequest("/pitches", { signal }),
  ]);

  return {
    user: identity.user,
    products: products.products,
    inventory: inventory.products,
    pitches: pitches.pitches,
  };
}