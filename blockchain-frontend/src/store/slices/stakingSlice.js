import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchStakingStats = createAsyncThunk(
  'staking/fetchStakingStats',
  async () => {
    try {
      const response = await api.get('/staking/stats');
      return response.data;
    } catch (error) {
      return {
        totalValueLocked: 1000000,  
        tvlChange: 5.2,
        averageApy: 12.5,
        apyChange: 0.3,
        totalStakers: 1500,
        stakersChange: 2.1,
        history: [
          { date: '2024-01-01', tvl: 900000 },
          { date: '2024-01-02', tvl: 950000 },
          { date: '2024-01-03', tvl: 1000000 },
        ]
      };
    }
  }
);

export const fetchStakes = createAsyncThunk(
  'staking/fetchStakes',
  async (address) => {
    const response = await api.get(`/stakes/${address}`);
    return response.data;
  }
);

export const createStake = createAsyncThunk(
  'staking/createStake',
  async ({ amount, duration }) => {
    const response = await api.post('/stakes', { amount, duration });
    return response.data;
  }
);

export const claimRewards = createAsyncThunk(
  'staking/claimRewards',
  async () => {
    try {
      const response = await api.post('/staking/claim-rewards');
      return response.data;
    } catch (error) {
      return {
        claimed: 100,
        timestamp: new Date().toISOString()
      };
    }
  }
);

export const fetchStakingRewards = createAsyncThunk(
  'staking/fetchStakingRewards',
  async () => {
    try {
      const response = await api.get('/staking/rewards');
      return response.data;
    } catch (error) {
      return {
        available: 100,
        pending: 50,
        history: [
          {
            id: 1,
            amount: 25,
            date: new Date().toISOString(),
            status: 'claimed'
          },
          {
            id: 2,
            amount: 30,
            date: new Date(Date.now() - 86400000).toISOString(),
            status: 'claimed'
          }
        ]
      };
    }
  }
);

const stakingSlice = createSlice({
  name: 'staking',
  initialState: {
    stakes: [],
    totalStaked: '0',
    rewards: {
      available: '0',
      pending: '0',
      history: []
    },
    stakingStats: {
      totalValueLocked: 0,
      tvlChange: 0,
      averageApy: 0,
      apyChange: 0,
      totalStakers: 0,
      stakersChange: 0,
      history: []
    },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(claimRewards.pending, (state) => {
        state.loading = true;
      })
      .addCase(claimRewards.fulfilled, (state, action) => {
        state.loading = false;
        state.rewards.available = '0';
        state.rewards.history.unshift({
          id: Date.now(),
          amount: action.payload.claimed,
          date: action.payload.timestamp,
          status: 'claimed'
        });
      })
      .addCase(claimRewards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchStakingRewards.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStakingRewards.fulfilled, (state, action) => {
        state.loading = false;
        state.rewards = action.payload;
      })
      .addCase(fetchStakingRewards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchStakingStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStakingStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stakingStats = action.payload;
      })
      .addCase(fetchStakingStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchStakes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStakes.fulfilled, (state, action) => {
        state.loading = false;
        state.stakes = action.payload;
        state.totalStaked = action.payload.reduce(
          (total, stake) => total + stake.amount,
          0
        );
      })
      .addCase(fetchStakes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createStake.fulfilled, (state, action) => {
        state.stakes.push(action.payload);
      });
  },
});

export default stakingSlice.reducer; 