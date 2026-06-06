const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export default apiFetch;
