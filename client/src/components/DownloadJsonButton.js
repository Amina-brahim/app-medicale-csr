import React from 'react';

const DownloadJsonButton = () => {
  const jsonData = {
    name: "John Doe",
    age: 30,
    occupation: "Developer",
  };

  const downloadJsonFile = () => {
    // Convert JSON data to string
    const jsonString = JSON.stringify(jsonData, null, 2); // Pretty print with 2 spaces
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a link element
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json'; // Name your file

    // Append the link to the body
    document.body.appendChild(a);

    // Trigger the download by simulating a click
    a.click();

    // Clean up and remove the link
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Free up memory
  };

  return (
    <div>
      <button onClick={downloadJsonFile}>Download JSON</button>
    </div>
  );
};

export default DownloadJsonButton;
