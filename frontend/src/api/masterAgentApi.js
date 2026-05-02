import axios from 'axios';

const masterApi = axios.create({
  baseURL: process.env.NODE_ENV === 'development'
    ? `http://${window.location.hostname}:3001`
    : 'http://localhost:3001',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const sendTaskToMaster = async (task, options = {}) => {
  try {
    const response = await masterApi.post('/api/master/task', { task, options });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default masterApi;