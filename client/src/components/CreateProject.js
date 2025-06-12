import React, { useState } from 'react';
import axios from '../api/axios';

const CreateProject = ({ userId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    try {
      const res = await axios.post('/projects', {
        name,
        description,
        owner: userId
      });
      alert(`Project Created: ${res.data.name}`);
    } catch (err) {
      alert("Error creating project");
    }
  };

  return (
    <div>
      <h2>Create Project</h2>
      <input
        placeholder="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      /><br />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      ></textarea><br />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
};

export default CreateProject;
