import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

// Blockchain Core
export const blockchainApi = {
  getStatus: () => api.get('/status'),
  getNetworkStats: () => api.get('/network-stats'),
  getBlock: (hash) => api.get(`/blocks/${hash}`),
  getBlocks: (page = 1, limit = 10) => api.get(`/blocks?page=${page}&limit=${limit}`),
  getTransaction: (hash) => api.get(`/transactions/${hash}`),
  getTransactions: (page = 1, limit = 10) => api.get(`/transactions?page=${page}&limit=${limit}`),
  getMempoolTransactions: () => api.get('/mempool'),
  broadcastTransaction: (tx) => api.post('/transactions/broadcast', tx),
  validateAddress: (address) => api.post('/validate-address', { address })
};

// Node Management
export const nodeApi = {
  getPeers: () => api.get('/peers'),
  addPeer: (peerUrl) => api.post('/peers', { url: peerUrl }),
  removePeer: (peerId) => api.delete(`/peers/${peerId}`),
  getSyncStatus: () => api.get('/sync-status'),
  startSync: () => api.post('/sync/start'),
  stopSync: () => api.post('/sync/stop')
};

// Wallet
export const walletApi = {
  getBalance: (address) => api.get(`/wallets/${address}/balance`),
  getTransactions: (address) => api.get(`/wallets/${address}/transactions`),
  createTransaction: (data) => api.post('/transactions/create', data),
  estimateGas: (txData) => api.post('/estimate-gas', txData)
};

// Staking
export const stakingApi = {
  getStakes: (address) => api.get(`/stakes/${address}`),
  createStake: (data) => api.post('/stakes', data),
  withdrawStake: (stakeId) => api.post(`/stakes/${stakeId}/withdraw`),
  getRewards: (address) => api.get(`/stakes/${address}/rewards`),
  claimRewards: (address) => api.post(`/stakes/${address}/claim-rewards`)
};

// Governance
export const governanceApi = {
  getProposals: () => api.get('/proposals'),
  getProposal: (id) => api.get(`/proposals/${id}`),
  createProposal: (data) => api.post('/proposals', data),
  voteOnProposal: (proposalId, vote) => api.post(`/proposals/${proposalId}/vote`, { vote }),
  getVotingPower: (address) => api.get(`/voting-power/${address}`)
};

// Mining
export const miningApi = {
  getStatus: () => api.get('/mining/status'),
  startMining: () => api.post('/mining/start'),
  stopMining: () => api.post('/mining/stop'),
  getMiningStats: () => api.get('/mining/stats')
};

// Analytics
export const analyticsApi = {
  getNetworkMetrics: () => api.get('/analytics/network'),
  getTransactionMetrics: () => api.get('/analytics/transactions'),
  getStakingMetrics: () => api.get('/analytics/staking'),
  getGovernanceMetrics: () => api.get('/analytics/governance')
};

export default api;
