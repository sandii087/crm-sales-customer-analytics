const API_BASE = "http://" + "127.0.0.1:8000";

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export const customerApi = {
  getSegments: () => request("/api/dashboard/customer-segments"),
};
