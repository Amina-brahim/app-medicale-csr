import React, { useState, useEffect } from 'react';

// Assuming the JSON data is fetched from an API or imported


function UpdateCSRid() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    // Load data into state
    setRecords(data);
  }, []);

  // Filter records based on search term
  const filteredRecords = records.filter(record =>
    record.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditChange = (e) => {
    if (selectedRecord) {
      setSelectedRecord({ ...selectedRecord, [e.target.name]: e.target.value });
    }
  };

  const handleSelectRecord = (record) => {
    setSelectedRecord(record);
  };

  const handleSave = () => {
    if (selectedRecord) {
      setRecords(prevRecords =>
        prevRecords.map(record =>
          record.id === selectedRecord.id ? selectedRecord : record
        )
      );
      setSelectedRecord(null); // Reset selected record
    }
  };

  return (
    <div>
      <h1>Record Search and Edit</h1>
      <input
        type="text"
        placeholder="Search by name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <h2>Records</h2>
      <ul>
        {filteredRecords.map(record => (
          <li key={record.id} onClick={() => handleSelectRecord(record)}>
            {record.name}, Age: {record.age}
          </li>
        ))}
      </ul>

      {selectedRecord && (
        <div>
          <h2>Edit Record</h2>
          <input
            type="text"
            name="name"
            value={selectedRecord.name}
            onChange={handleEditChange}
          />
          <input
            type="number"
            name="age"
            value={selectedRecord.age}
            onChange={handleEditChange}
          />
          <button onClick={handleSave}>Save</button>
        </div>
      )}
    </div>
  );
}

export default UpdateCSRid;
