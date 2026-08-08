import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bbc_pos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);
