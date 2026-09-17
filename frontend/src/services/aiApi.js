const API_BASE_URL = 'http://127.0.0.1:8000';

export const aiApi = {
  async getBusinessForecast() {
    const response = await fetch(
      `${API_BASE_URL}/api/ai/business-forecast`
    );

    if (!response.ok) {
      throw new Error('Failed to load business forecast');
    }

    return response.json();
  },
};
