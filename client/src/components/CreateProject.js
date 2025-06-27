import React, { useState } from 'react';
import axios from '../api/axios';
import Swal from 'sweetalert2';

const CreateProject = ({ userId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');

  const handleCreate = async () => {
    try {
      const res = await axios.post('/projects', {
        name,
        description,
        category,
        owner: userId
      });
      Swal.fire({ icon: 'success', title: 'Success', text: `Project Created: ${res.data.name}` });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error creating project' });
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
      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      /><br />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
};

export default CreateProject;
