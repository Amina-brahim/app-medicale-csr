// src/WordUpload.js
import React, { useState } from 'react';

const WordUpload = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');

    const handleFileChange = (event) => {
        const uploadedFile = event.target.files[0];
        
        if (uploadedFile && (uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || uploadedFile.type === 'application/msword')) {
            setFile(uploadedFile);
            setMessage(`File uploaded: ${uploadedFile.name}`);
        } else {
            setMessage('Please upload a valid Word document (.docx or .doc)');
        }
    };

    const handleUpload = (event) => {
        event.preventDefault();
        // Handle the file uploading process here
        if (file) {
            console.log('Uploading file:', file);
            // You can use FormData to send the file to the server if needed
        }
    };

    return (
        <div>
            <h2>Charger votre modèle de résultats</h2>
            <form onSubmit={handleUpload}>
                <input type="file" accept=".doc,.docx" onChange={handleFileChange} />
                <button type="submit">Charger</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default WordUpload;