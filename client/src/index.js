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


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
