// FloatingBar.js
import React from 'react';
import './FloatingBar.css';

const FloatingBar = () => {
  const handleClick = () => {
    // Handle button click actions here
    alert('Floating action button clicked!');
  };

  return (
    <div className="floating-bar">
      <button className="floating-button" onClick={handleClick}>
        +
      </button>
    </div>
  );
};

export default FloatingBar;