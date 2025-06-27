import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import API from '../api/axios';
import Swal from 'sweetalert2';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const ProjectCalendar = ({ projectId }) => {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  // Fetch events and tasks for the project
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, tasksRes] = await Promise.all([
        API.get(`/events?project=${projectId}`),
        API.get(`/tasks?project=${projectId}&assignedTo=${user?._id}`),
      ]);
      setEvents(eventsRes.data.map(ev => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
        title: ev.title,
      })));
      setTasks(tasksRes.data);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load events or tasks.' });
    } finally {
      setLoading(false);
    }
  }, [projectId, user?._id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Add Event
  const handleSelectSlot = async ({ start, end }) => {
    const { value: title } = await Swal.fire({
      title: 'Add Event',
      input: 'text',
      inputLabel: 'Event Title',
      showCancelButton: true,
    });
    if (title) {
      try {
        await API.post('/events', { title, start, end, project: projectId });
        fetchData();
        Swal.fire({ icon: 'success', title: 'Event added!' });
      } catch {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to add event.' });
      }
    }
  };

  // Add Task
  const handleAddTask = async () => {
    const { value: title } = await Swal.fire({
      title: 'Add Task',
      input: 'text',
      inputLabel: 'Task Title',
      showCancelButton: true,
    });
    if (title) {
      try {
        await API.post('/tasks', { title, project: projectId });
        fetchData();
        Swal.fire({ icon: 'success', title: 'Task added!' });
      } catch {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to add task.' });
      }
    }
  };

  
  const handleToggleTask = async (task) => {
    try {
      await API.put(`/tasks/${task._id}`, { completed: !task.completed });
      fetchData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update task.' });
    }
  };

 
  const handleSelectEvent = async (event) => {
    const result = await Swal.fire({
      title: 'Delete Event?',
      text: event.title,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      icon: 'warning',
    });
    if (result.isConfirmed) {
      try {
        await API.delete(`/events/${event._id}`);
        fetchData();
        Swal.fire({ icon: 'success', title: 'Event deleted!' });
      } catch {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete event.' });
      }
    }
  };

  
  const handleDeleteTask = async (task) => {
    const result = await Swal.fire({
      title: 'Delete Task?',
      text: task.title,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      icon: 'warning',
    });
    if (result.isConfirmed) {
      try {
        await API.delete(`/tasks/${task._id}`);
        fetchData();
        Swal.fire({ icon: 'success', title: 'Task deleted!' });
      } catch {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete task.' });
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'flex-start', gap: 48, padding: '56px 0 40px 0', minWidth: 900, maxWidth: '100vw', margin: '0 auto', boxSizing: 'border-box', overflowX: 'auto' }}>
      <div className="calendar-card">
        <h2 style={{ marginBottom: 18, textAlign: 'center' }}>📅 Project Calendar</h2>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
        />
      </div>
      <div className="todo-list-card">
        <h2 style={{ marginBottom: 18, textAlign: 'center' }}>📝 To-Do List</h2>
        <button onClick={handleAddTask} style={{ marginBottom: 16, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>+ Add Task</button>
        <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
          {tasks.map(task => (
            <li key={task._id} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task)} style={{ marginRight: 8 }} />
              <span style={{ textDecoration: task.completed ? 'line-through' : 'none', flex: 1 }}>{task.title}</span>
              <button onClick={() => handleDeleteTask(task)} style={{ marginLeft: 8, background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProjectCalendar; 