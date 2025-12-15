import React from 'react';
import './HexagonButton.css';

const HexagonButton = ({ onClick, children }) => {
    return (
        <div className="hexagon" onClick={onClick}>
            {children}
        </div>
    );
};

export default HexagonButton;