import axios from 'axios';
// Ensure axios types are installed: npm install --save-dev @types/axios

const apiClient = axios.create({
  baseURL: '/api', // Proxy to NestJS backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
