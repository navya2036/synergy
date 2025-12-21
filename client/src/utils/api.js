import axios from 'axios';

// Create an Axios instance with custom config
const api = axios.create({
  baseURL: 'https://synergy-ut87.onrender.com',
  timeout: 120000, // 2 minutes
  timeoutErrorMessage: 'Request timed out',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token and handle retries
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor for retries on network errors
api.interceptors.response.use(undefined, async error => {
  const { config, message } = error;
  
  // Only retry once
  if (config._retry || !config) {
    return Promise.reject(error);
  }

  // Retry only on network errors or timeouts
  if (message === 'Network Error' || message === 'timeout of ' + config.timeout + 'ms exceeded') {
    config._retry = true;
    try {
      const response = await api(config);
      return response;
    } catch (retryError) {
      return Promise.reject(retryError);
    }
  }

  return Promise.reject(error);
});

// Create FormData axios instance with different timeout for file uploads
export const formDataApi = axios.create({
  baseURL: 'https://synergy-ut87.onrender.com',
  timeout: 300000, // 5 minutes for file uploads
  timeoutErrorMessage: 'Upload timed out',
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Add request interceptor to always include the latest token
formDataApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Configure interceptors for formDataApi
formDataApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

formDataApi.interceptors.response.use(undefined, async error => {
  const { config, message } = error;
  
  if (config._retry || !config) {
    return Promise.reject(error);
  }

  if (message === 'Network Error' || message === 'timeout of ' + config.timeout + 'ms exceeded') {
    config._retry = true;
    try {
      const response = await formDataApi(config);
      return response;
    } catch (retryError) {
      return Promise.reject(retryError);
    }
  }

  return Promise.reject(error);
});

export default api;