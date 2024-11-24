import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Thunk for fetching dashboard data
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async () => {
    // Simulated API response
    return {
      stats: {
        tvl: '$1.23B',
        volume24h: '$423.5M',
        activeUsers: '125.3K',
        networkTps: '1,234'
      },
      priceData: [
        { name: 'Jan', value: 4000 },
        { name: 'Feb', value: 3000 },
        { name: 'Mar', value: 2000 },
        { name: 'Apr', value: 2780 },
        { name: 'May', value: 1890 },
        { name: 'Jun', value: 2390 },
        { name: 'Jul', value: 3490 },
      ],
      volumeData: [
        { name: 'Jan', volume: 2400, transactions: 400 },
        { name: 'Feb', volume: 1398, transactions: 300 },
        { name: 'Mar', volume: 9800, transactions: 500 },
        { name: 'Apr', volume: 3908, transactions: 450 },
        { name: 'May', volume: 4800, transactions: 460 },
        { name: 'Jun', volume: 3800, transactions: 380 },
        { name: 'Jul', volume: 4300, transactions: 430 },
      ]
    };
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: {
      tvl: '0',
      volume24h: '0',
      activeUsers: '0',
      networkTps: '0'
    },
    priceData: [],
    volumeData: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.priceData = action.payload.priceData;
        state.volumeData = action.payload.volumeData;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export default dashboardSlice.reducer; 