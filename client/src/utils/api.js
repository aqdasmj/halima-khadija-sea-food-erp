export function getApiBaseUrl() {
  const customUrl = localStorage.getItem('boat_finance_custom_api');
  if (customUrl) return customUrl;

  if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
    return 'https://usc-examination-animals-volume.trycloudflare.com/api';
  }

  return '/api';
}

export function getAuthToken() {
  return localStorage.getItem('boat_finance_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('boat_finance_token', token);
  } else {
    localStorage.removeItem('boat_finance_token');
  }
}

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  headers['Bypass-Tunnel-Remainder'] = 'true';
  headers['ngrok-skip-browser-warning'] = 'true';

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const baseUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      setAuthToken(null);
      localStorage.removeItem('boat_finance_user');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server Error (${response.status})`);
      }
      return data;
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Server Error (${response.status})`);
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    }
  } catch (err) {
    console.error(`API Fetch Error [${endpoint}]:`, err.message);
    throw err;
  }
}
