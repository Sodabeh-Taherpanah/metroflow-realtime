import axios from 'axios';
// Ensure axios types are installed: npm install --save-dev @types/axios

const apiClient = axios.create({
  baseURL: '/api', // Use Next.js proxy
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
