import api from './config';

export const walletService = {
  getBalance: async (address) => {
    const response = await api.get(`/wallet/${address}/balance`);
    return response.data;
  },

  getTransactionHistory: async (address, page = 1, limit = 10) => {
    const response = await api.get(`/wallet/${address}/transactions?page=${page}&limit=${limit}`);
    return response.data;
  },

  sendTransaction: async (data) => {
    const response = await api.post('/wallet/transaction', data);
    return response.data;
  },

  estimateGas: async (data) => {
    const response = await api.post('/wallet/estimate-gas', data);
    return response.data;
  }
}; 