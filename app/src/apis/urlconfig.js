const API_BASE_URL = "http://localhost:8000/api";

function getCookie(name) {
  const prefix = `${name}=`;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

export async function fetchBackend(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  // Obtain the CSRF cookie before requests that change data.
  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const csrfResponse = await fetch(`${API_BASE_URL}/csrf/`, {
      method: "GET",
      credentials: "include",
    });

    if (!csrfResponse.ok) {
      throw new Error("Failed to obtain the CSRF cookie.");
    }
  }

  const headers = {
    ...options.headers,
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const token = getCookie("csrftoken");

    if (!token) {
      throw new Error(
        "CSRF token missing. Check Django's CSRF cookie settings."
      );
    }

    headers["X-CSRFToken"] = token;
  }

  console.log(`Calling backend at ${API_BASE_URL}${path} with `, options)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      error.error || `API request failed: ${response.status}`
    );
  }

  if (path.includes('pdf')) {
    return response.blob();
  }
  
  return response.json();
}