// api/axios.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api', // or your actual backend base URL
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add a request interceptor to add the auth token to every request
API.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    let authToken = token;
    
    // If no direct token, try to get it from user object
    if (!authToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        authToken = user.token;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
      console.log('Added auth token to request:', config.url);
    } else {
      console.warn('No auth token found for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
API.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      console.log('Unauthorized access, redirecting to login...');
      // Clear all auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
