import api from './config';

export const stakingService = {
  getStakingStats: async () => {
    const response = await api.get('/staking/stats');
    return response.data;
  },

  getUserStakes: async (address) => {
    const response = await api.get(`/staking/stakes/${address}`);
    return response.data;
  },

  createStake: async (data) => {
    const response = await api.post('/staking/stakes', data);
    return response.data;
  },

  extendStake: async (stakeId, duration) => {
    const response = await api.put(`/staking/stakes/${stakeId}/extend`, { duration });
    return response.data;
  },

  unstake: async (stakeId) => {
    const response = await api.post(`/staking/stakes/${stakeId}/unstake`);
    return response.data;
  },

  getRewards: async (address) => {
    const response = await api.get(`/staking/rewards/${address}`);
    return response.data;
  },

  claimRewards: async (address) => {
    const response = await api.post(`/staking/rewards/${address}/claim`);
    return response.data;
  },

  getRewardHistory: async (address, page = 1, limit = 10) => {
    const response = await api.get(`/staking/rewards/${address}/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  getValidators: async () => {
    const response = await api.get('/staking/validators');
    return response.data;
  },

  getValidatorDetails: async (validatorId) => {
    const response = await api.get(`/staking/validators/${validatorId}`);
    return response.data;
  },

  delegateToValidator: async (validatorId, amount) => {
    const response = await api.post(`/staking/validators/${validatorId}/delegate`, { amount });
    return response.data;
  },

  undelegateFromValidator: async (validatorId, amount) => {
    const response = await api.post(`/staking/validators/${validatorId}/undelegate`, { amount });
    return response.data;
  },

  getStakingAnalytics: async (timeframe = '24h') => {
    const response = await api.get(`/staking/analytics?timeframe=${timeframe}`);
    return response.data;
  },

  getAPYHistory: async (timeframe = '30d') => {
    const response = await api.get(`/staking/analytics/apy-history?timeframe=${timeframe}`);
    return response.data;
  }
}; 