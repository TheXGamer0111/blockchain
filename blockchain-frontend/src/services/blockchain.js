import api from './api';
import { toast } from 'react-toastify';

export const blockchainService = {
  // Block Management
  mineBlock: async () => {
    try {
      const response = await api.post('/blocks/mine');
      toast.success('Block mined successfully');
      return response.data;
    } catch (error) {
      toast.error('Mining failed: ' + error.message);
      throw error;
    }
  },
  
  // Chain Operations
  validateChain: async () => {
    try {
      const response = await api.get('/chain/validate');
      if (response.data.valid) {
        toast.success('Blockchain is valid');
      } else {
        toast.warning('Blockchain validation failed');
      }
      return response.data;
    } catch (error) {
      toast.error('Validation check failed: ' + error.message);
      throw error;
    }
  },

  getChainInfo: async () => {
    try {
      const response = await api.get('/chain/info');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch chain info: ' + error.message);
      throw error;
    }
  },
  
  // Network & Peer Management
  getPeers: async () => {
    try {
      const response = await api.get('/network/peers');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch peers: ' + error.message);
      throw error;
    }
  },

  addPeer: async (peerUrl) => {
    try {
      const response = await api.post('/network/peers', { url: peerUrl });
      toast.success('Peer added successfully');
      return response.data;
    } catch (error) {
      toast.error('Failed to add peer: ' + error.message);
      throw error;
    }
  },

  removePeer: async (peerId) => {
    try {
      const response = await api.delete(`/network/peers/${peerId}`);
      toast.success('Peer removed successfully');
      return response.data;
    } catch (error) {
      toast.error('Failed to remove peer: ' + error.message);
      throw error;
    }
  },
  
  // Consensus
  participateInConsensus: async () => {
    try {
      const response = await api.post('/consensus/participate');
      toast.success('Successfully participated in consensus');
      return response.data;
    } catch (error) {
      toast.error('Consensus participation failed: ' + error.message);
      throw error;
    }
  },

  getConsensusStatus: async () => {
    try {
      const response = await api.get('/consensus/status');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch consensus status: ' + error.message);
      throw error;
    }
  },

  // Block Explorer Functions
  getBlock: async (blockHash) => {
    try {
      const response = await api.get(`/blocks/${blockHash}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch block: ' + error.message);
      throw error;
    }
  },

  getBlocks: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/blocks?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch blocks: ' + error.message);
      throw error;
    }
  },

  // Transaction Pool
  getMempoolTransactions: async () => {
    try {
      const response = await api.get('/mempool');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch mempool: ' + error.message);
      throw error;
    }
  },

  // Network Statistics
  getNetworkStats: async () => {
    try {
      const response = await api.get('/network/stats');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch network stats: ' + error.message);
      throw error;
    }
  },

  // Sync Status
  getSyncStatus: async () => {
    try {
      const response = await api.get('/sync/status');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch sync status: ' + error.message);
      throw error;
    }
  },

  startSync: async () => {
    try {
      const response = await api.post('/sync/start');
      toast.success('Blockchain sync started');
      return response.data;
    } catch (error) {
      toast.error('Failed to start sync: ' + error.message);
      throw error;
    }
  },

  stopSync: async () => {
    try {
      const response = await api.post('/sync/stop');
      toast.success('Blockchain sync stopped');
      return response.data;
    } catch (error) {
      toast.error('Failed to stop sync: ' + error.message);
      throw error;
    }
  }
};

export default blockchainService;