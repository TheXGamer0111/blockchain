import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchNetworkStats = createAsyncThunk(
  'blockchain/fetchNetworkStats',
  async () => {
    const response = await api.get('/status');
    return response.data;
  }
);

export const fetchRecentBlocks = createAsyncThunk(
  'blockchain/fetchRecentBlocks',
  async () => {
    const response = await api.get('/blocks/recent');
    return response.data;
  }
);

const blockchainSlice = createSlice({
  name: 'blockchain',
  initialState: {
    networkStats: {
      peers: 0,
      blocks: 0,
      transactions: 0,
      mempool: 0,
    },
    recentBlocks: [],
    loading: false,
    error: null,
  },
  reducers: {
    addBlock: (state, action) => {
      state.recentBlocks.unshift(action.payload);
      state.networkStats.blocks += 1;
    },
    updateNetworkStats: (state, action) => {
      state.networkStats = action.payload;
    },
    updateMempoolTransactions: (state, action) => {
      state.networkStats.mempool = action.payload.length;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNetworkStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNetworkStats.fulfilled, (state, action) => {
        state.loading = false;
        state.networkStats = action.payload;
      })
      .addCase(fetchNetworkStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchRecentBlocks.fulfilled, (state, action) => {
        state.recentBlocks = action.payload;
      });
  },
});

export const { 
  addBlock, 
  updateNetworkStats, 
  updateMempoolTransactions 
} = blockchainSlice.actions;

export default blockchainSlice.reducer; 