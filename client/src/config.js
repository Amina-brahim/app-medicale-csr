// src/config.js
const config = {
  // Développement
  development: {
    apiUrl: 'http://localhost:5000',
    socketUrl: 'http://localhost:4600',
    enableSockets: true
  },
  // Test/Staging
  test: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    socketUrl: process.env.REACT_APP_SOCKET_URL || null,
    enableSockets: false
  },
  // Production
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    socketUrl: process.env.REACT_APP_SOCKET_URL || null,
    enableSockets: !!process.env.REACT_APP_SOCKET_URL
  }
};

const environment = process.env.NODE_ENV || 'development';
const currentConfig = config[environment];

// Log de configuration (seulement en développement)
if (environment === 'development') {
  console.log(`⚙️ Configuration chargée: ${environment}`, currentConfig);
}

export default currentConfig;
