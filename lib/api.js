export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Algo falló, probá en unos minutos.");
  }

  const body = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error("Algo falló, probá en unos minutos.");
  }

  return body;
}
