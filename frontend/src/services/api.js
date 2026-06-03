const API_BASE = '/api';

export async function calculateSplit(data) {
  const response = await fetch(`${API_BASE}/split/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ошибка ${response.status}: ${text}`);
  }

  return response.json();
}