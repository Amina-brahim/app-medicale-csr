import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';


/*
const handleSubmit = (event) => {
  event.preventDefault();
  const message = // get message from input field or state

  if (socket && message) {
    socket.emit('new-message', message);
  }
};

useEffect(() => {
  // ...

  return () => {
    if (socketInstance) {
      socketInstance.disconnect();
    }
  };
}, [socket]);

*/
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// Dans src/index.js ou votre composant principal
window.checkConnection = async () => {
  const endpoints = [
    'http://localhost:5000/api/health',
    'http://localhost:5000/',
    '/api/health',
    '/'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      console.log(`✅ ${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
};

// Exécutez dans la console du navigateur : checkConnection()


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
