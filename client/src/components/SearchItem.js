import React, { useState } from "react";

// Sample JSON data
const initialData = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  { id: 3, name: "Alice Johnson", email: "alice@example.com" },
];

const App = () => {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Search function
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Find record based on search term
  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load record into edit form
  const handleEditClick = (record) => {
    setRecordToEdit(record);
    setNewName(record.name);
    setNewEmail(record.email);
  };

  // Update record
  const handleUpdate = () => {
    const updatedData = data.map((item) =>
      item.id === recordToEdit.id
        ? { ...item, name: newName, email: newEmail }
        : item
    );
    setData(updatedData);
    setRecordToEdit(null); // Reset editing view
  };

  return (
    <div>
      <h1>JSON Record Search and Edit</h1>
      <input
        type="text"
        placeholder="Search by name"
        value={searchTerm}
        onChange={handleSearch}
      />

      <ul>
        {filteredData.map((item) => (
          <li key={item.id}>
            {item.name} - {item.email} 
            <button onClick={() => handleEditClick(item)}>Edit</button>
          </li>
        ))}
      </ul>

      {recordToEdit && (
        <div>
          <h2>Edit Record</h2>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button onClick={handleUpdate}>Update</button>
          <button onClick={() => setRecordToEdit(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default App;
