import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchData',
  async () => {
    // API call to fetch analytics data
    const response = await fetch('/api/analytics')
    return response.data
  }
)

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    blockTimes: [],
    transactionVolume: [],
    networkHashrate: [],
    isLoading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.isLoading = false
        state.blockTimes = action.payload.blockTimes
        state.transactionVolume = action.payload.transactionVolume
        state.networkHashrate = action.payload.networkHashrate
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
  }
})

export default analyticsSlice.reducer 