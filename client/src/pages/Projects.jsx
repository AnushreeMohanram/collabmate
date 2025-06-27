import { useState, useEffect } from 'react';
import API from '../api/axios';
import ProjectCard from './ProjectCard';
import FilterBar from './FilterBar';
import Swal from 'sweetalert2';
import ProjectCalendar from './ProjectCalendar';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [activeProjectTab, setActiveProjectTab] = useState('details');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredProjects(
      projects.filter(
        (proj) =>
          ((proj.name || proj.title || '').toLowerCase().includes(term)) ||
          ((proj.description || '').toLowerCase().includes(term))
      )
    );
  }, [searchTerm, projects]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await API.get('/projects');
      const sortedProjects = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProjects(sortedProjects);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error fetching projects' });
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !newDescription.trim()) return;
    try {
      await API.post('/projects', { name: newTitle, description: newDescription });
      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');
      fetchProjects();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to add project' });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Delete this project?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete project' });
    }
  };

  const filteredProjectsByTab = activeTab === 'all' 
    ? filteredProjects 
    : activeTab === 'owned'
    ? filteredProjects.filter(p => p.userRole === 'owner')
    : filteredProjects.filter(p => p.userRole && p.userRole !== 'owner');

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.heading}>✨ Your Projects</h1>
        <button style={styles.addButton} onClick={() => setShowAddModal(true)}>+ Add Project</button>
      </div>
      <div style={styles.centeredSearchBar}>
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
        <p style={styles.noProjects}>No projects yet. Click 'Add Project' to create one!</p>
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
      {/* Add Project Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Add New Project</h2>
            <input
              type="text"
              placeholder="Project Title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              style={styles.modalInput}
            />
            <textarea
              placeholder="Project Description"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              style={styles.modalTextarea}
            />
            <div style={styles.modalActions}>
              <button style={styles.modalButton} onClick={handleAdd} disabled={!newTitle.trim() || !newDescription.trim()}>
                Add Project
              </button>
              <button style={styles.modalCancel} onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Project Details Modal */}
      {selectedProject && (
        <div style={styles.modalOverlay} onClick={() => setSelectedProject(null)}>
          <div style={{
            ...styles.modal,
            maxWidth: activeProjectTab === 'calendar' ? 1100 : 420,
            width: activeProjectTab === 'calendar' ? '95vw' : '90%',
            minHeight: activeProjectTab === 'calendar' ? 650 : undefined,
            overflow: 'visible',
            padding: activeProjectTab === 'calendar' ? 0 : 36,
            position: 'relative',
            zIndex: 2000,
          }} onClick={e => e.stopPropagation()}>
            <button
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                background: '#fff',
                border: 'none',
                fontSize: 40,
                color: '#1e293b',
                cursor: 'pointer',
                zIndex: 2100,
                padding: 0,
                lineHeight: 1,
                borderRadius: '50%',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#4f46e5'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1e293b'; }}
              aria-label="Close project details"
              onClick={() => setSelectedProject(null)}
            >
              ×
            </button>
            <h2 style={{...styles.modalTitle, marginBottom: 8}}>{selectedProject.name || selectedProject.title}</h2>
            <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
              <button onClick={() => setActiveProjectTab('details')} style={{ ...styles.tab, ...(activeProjectTab === 'details' ? styles.activeTab : {}) }}>Details</button>
              <button onClick={() => setActiveProjectTab('calendar')} style={{ ...styles.tab, ...(activeProjectTab === 'calendar' ? styles.activeTab : {}) }}>Calendar & Tasks</button>
            </div>
            {activeProjectTab === 'details' && (
              <>
                <p style={{...styles.modalTextarea, color: '#475569', fontSize: 15, marginBottom: 18}}>{selectedProject.description}</p>
                <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: '#334155' }}>Status:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: selectedProject.status === 'completed' ? '#22c55e' : '#64748b', fontWeight: 500, fontSize: 15 }}>
                      {selectedProject.status === 'completed' ? 'Completed' : 'Active'}
                    </span>
                    {selectedProject.userRole === 'owner' && user && (
                      <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, marginLeft: 8 }}>
                        <input
                          type="checkbox"
                          checked={selectedProject.status === 'completed'}
                          onChange={async (e) => {
                            const newStatus = e.target.checked ? 'completed' : 'active';
                            try {
                              await API.patch(`/projects/${selectedProject._id}`, { status: newStatus });
                              setSelectedProject({ ...selectedProject, status: newStatus });
                              setProjects(projects => projects.map(p => p._id === selectedProject._id ? { ...p, status: newStatus } : p));
                              await Swal.fire({
                                icon: 'success',
                                title: 'Status Updated',
                                text: `Project marked as ${newStatus}.`,
                                background: newStatus === 'completed' ? '#d1fae5' : '#e0e7ff',
                                color: newStatus === 'completed' ? '#065f46' : '#1e293b',
                                confirmButtonColor: newStatus === 'completed' ? '#22c55e' : '#4f46e5',
                                customClass: { popup: 'swal2-border-radius' }
                              });
                            } catch (err) {
                              await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update project status.' });
                            }
                          }}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: selectedProject.status === 'completed' ? '#22c55e' : '#e5e7eb',
                          borderRadius: 26,
                          transition: 'background 0.2s',
                          boxShadow: selectedProject.status === 'completed' ? '0 0 0 2px #bbf7d0' : 'none',
                        }}></span>
                        <span style={{
                          position: 'absolute',
                          left: selectedProject.status === 'completed' ? 24 : 2,
                          top: 2,
                          width: 22,
                          height: 22,
                          background: '#fff',
                          borderRadius: '50%',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                          transition: 'left 0.2s',
                          border: '1.5px solid #e5e7eb',
                        }}></span>
                      </label>
                    )}
                  </div>
                </div>
              </>
            )}
            {activeProjectTab === 'calendar' && (
              <ProjectCalendar projectId={selectedProject._id} />
            )}
          </div>
        </div>
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  heading: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(79,70,229,0.08)',
    transition: 'background 0.2s',
  },
  centeredSearchBar: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '30px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '32px',
    borderRadius: '12px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '10px',
    color: '#1e293b',
  },
  modalInput: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    marginBottom: '10px',
  },
  modalTextarea: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    minHeight: '80px',
    marginBottom: '10px',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  modalButton: {
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalCancel: {
    padding: '10px 20px',
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
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
};

export default Projects;