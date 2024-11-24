import api from './config';

export const governanceService = {
  // Proposals
  getProposals: async (status = 'all', page = 1, limit = 10) => {
    const response = await api.get(`/governance/proposals?status=${status}&page=${page}&limit=${limit}`);
    return response.data;
  },

  getProposalById: async (id) => {
    const response = await api.get(`/governance/proposals/${id}`);
    return response.data;
  },

  createProposal: async (data) => {
    const response = await api.post('/governance/proposals', data);
    return response.data;
  },

  updateProposal: async (id, data) => {
    const response = await api.put(`/governance/proposals/${id}`, data);
    return response.data;
  },

  cancelProposal: async (id) => {
    const response = await api.post(`/governance/proposals/${id}/cancel`);
    return response.data;
  },

  // Voting
  castVote: async (proposalId, vote) => {
    const response = await api.post(`/governance/proposals/${proposalId}/vote`, { vote });
    return response.data;
  },

  getVotes: async (proposalId, page = 1, limit = 10) => {
    const response = await api.get(`/governance/proposals/${proposalId}/votes?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUserVotes: async (address) => {
    const response = await api.get(`/governance/votes/${address}`);
    return response.data;
  },

  // Delegation
  delegateVotes: async (delegatee) => {
    const response = await api.post('/governance/delegate', { delegatee });
    return response.data;
  },

  getDelegation: async (address) => {
    const response = await api.get(`/governance/delegation/${address}`);
    return response.data;
  },

  // Analytics
  getGovernanceStats: async () => {
    const response = await api.get('/governance/stats');
    return response.data;
  },

  getVoterParticipation: async (timeframe = '30d') => {
    const response = await api.get(`/governance/analytics/participation?timeframe=${timeframe}`);
    return response.data;
  },

  getProposalTypeDistribution: async () => {
    const response = await api.get('/governance/analytics/proposal-types');
    return response.data;
  }
}; 