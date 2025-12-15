// Modal.js

import React from 'react';
//import './Modal.css'; // Ensure you have the corresponding CSS for styling

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                {children}
            </div>
        </div>
    );
};

export default Modal;
