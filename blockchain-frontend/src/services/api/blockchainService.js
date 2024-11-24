import api from './config';

export const blockchainService = {
  getNetworkStats: async () => {
    const response = await api.get('/blockchain/stats');
    return response.data;
  },

  getRecentBlocks: async (limit = 10) => {
    const response = await api.get(`/blockchain/blocks/recent?limit=${limit}`);
    return response.data;
  },

  getRecentTransactions: async (limit = 10) => {
    const response = await api.get(`/blockchain/transactions/recent?limit=${limit}`);
    return response.data;
  },

  getBlockByHash: async (hash) => {
    const response = await api.get(`/blockchain/blocks/${hash}`);
    return response.data;
  },

  getTransactionByHash: async (hash) => {
    const response = await api.get(`/blockchain/transactions/${hash}`);
    return response.data;
  },

  getBlockByNumber: async (number) => {
    const response = await api.get(`/blockchain/blocks/number/${number}`);
    return response.data;
  },

  getBlockTransactions: async (blockHash, page = 1, limit = 10) => {
    const response = await api.get(`/blockchain/blocks/${blockHash}/transactions?page=${page}&limit=${limit}`);
    return response.data;
  },

  getPendingTransactions: async () => {
    const response = await api.get('/blockchain/transactions/pending');
    return response.data;
  },

  getNetworkPeers: async () => {
    const response = await api.get('/blockchain/network/peers');
    return response.data;
  },

  getNetworkDifficulty: async () => {
    const response = await api.get('/blockchain/network/difficulty');
    return response.data;
  },

  getNetworkHashrate: async () => {
    const response = await api.get('/blockchain/network/hashrate');
    return response.data;
  },

  getTransactionVolume: async (timeframe = '24h') => {
    const response = await api.get(`/blockchain/analytics/volume?timeframe=${timeframe}`);
    return response.data;
  },

  getActiveAddresses: async (timeframe = '24h') => {
    const response = await api.get(`/blockchain/analytics/active-addresses?timeframe=${timeframe}`);
    return response.data;
  },

  getFeeStats: async () => {
    const response = await api.get('/blockchain/analytics/fee-stats');
    return response.data;
  }
}; 