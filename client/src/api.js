// src/api.js - Service API REST
class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: error.message };
    }
  }

  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: error.message };
    }
  }

  // Méthode pour vérifier la connexion
  async checkConnection() {
    return this.get('/api/health');
  }
}

// Instance globale
const api = new ApiService(
  process.env.NODE_ENV === 'production' 
    ? 'https://csr-serveur-backend.onrender.com'
    : 'http://localhost:4600'
);

export default api;
