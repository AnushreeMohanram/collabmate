import { useState, useEffect } from 'react';
import API from '../api/axios';
import ProjectCard from './ProjectCard';
import AddProjectForm from './AddProjectForm';
import FilterBar from './FilterBar';
import ProjectModal from './ProjectModal';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredProjects(
      projects.filter(
        (proj) =>
          proj.title.toLowerCase().includes(term) ||
          proj.description.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, projects]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await API.get('/projects');
      console.log('Fetched projects:', res.data);
      
      // Sort projects by creation date and add collaboration info
      const sortedProjects = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      console.log('Sorted projects with roles:', sortedProjects);
      
      setProjects(sortedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      alert('Error fetching projects');
    }
    setLoading(false);
  };

  const handleAdd = async (title, description) => {
    if (!title.trim() || !description.trim()) return;
    try {
      await API.post('/projects', { title, description });
      fetchProjects();
    } catch (err) {
      alert('Failed to add project');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await API.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const filteredProjectsByTab = activeTab === 'all' 
    ? filteredProjects 
    : activeTab === 'owned'
    ? filteredProjects.filter(p => p.userRole === 'owner')
    : filteredProjects.filter(p => p.userRole && p.userRole !== 'owner');

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>✨ Your Projects</h1>

      <div style={styles.controls}>
        <AddProjectForm onAdd={handleAdd} />
        <FilterBar value={searchTerm} onChange={setSearchTerm} />
      </div>

      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab('all')}
          style={activeTab === 'all' ? styles.activeTab : styles.tab}
        >
          All Projects ({filteredProjects.length})
        </button>
        <button 
          onClick={() => setActiveTab('owned')}
          style={activeTab === 'owned' ? styles.activeTab : styles.tab}
        >
          My Projects ({filteredProjects.filter(p => p.userRole === 'owner').length})
        </button>
        <button 
          onClick={() => setActiveTab('shared')}
          style={activeTab === 'shared' ? styles.activeTab : styles.tab}
        >
          Shared with Me ({filteredProjects.filter(p => p.userRole && p.userRole !== 'owner').length})
        </button>
      </div>

      {loading ? (
        <div style={styles.loader}>🔄 Loading projects...</div>
      ) : filteredProjectsByTab.length === 0 ? (
        <p style={styles.noProjects}>
          {activeTab === 'all' 
            ? 'No projects yet. Create your first project!' 
            : activeTab === 'owned'
            ? 'You haven\'t created any projects yet.'
            : 'No projects have been shared with you yet.'}
        </p>
      ) : (
        <div style={styles.grid}>
          {filteredProjectsByTab.map((proj, i) => (
            <div
              key={proj._id}
              style={{ animation: `fadeIn 0.3s ease ${i * 0.1}s both` }}
            >
              <ProjectCard
                project={proj}
                onDelete={handleDelete}
                onClick={() => setSelectedProject(proj)}
              />
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    marginLeft: '240px',
    padding: '50px',
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif',
    background: 'linear-gradient(135deg, #f0f4ff, #fff)',
  },
  heading: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '30px',
    color: '#1e293b',
  },
  controls: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#e2e8f0',
    },
  },
  activeTab: {
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: '20px',
    fontStyle: 'italic',
    color: '#64748b',
  },
  noProjects: {
    marginTop: '20px',
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: '16px',
  },
  grid: {
    display: 'grid',
    gap: '25px',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  },
};

export default Projects;
