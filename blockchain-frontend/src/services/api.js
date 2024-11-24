import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getNodeStatus = () => api.get('/status');
export const getNetworkStats = () => api.get('/network-stats');
export const getStakes = (address) => api.get(`/stakes/${address}`);
export const createStake = (data) => api.post('/stakes', data);
export const getProposals = () => api.get('/proposals');
export const createProposal = (data) => api.post('/proposals', data);
export const voteOnProposal = (data) => api.post('/proposals/vote', data);

export default api;
