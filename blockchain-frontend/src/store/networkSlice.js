import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getNetworkStatus, getPeers } from '../services/api'

export const fetchNetworkData = createAsyncThunk(
  'network/fetchData',
  async () => {
    const [statusRes, peersRes] = await Promise.all([
      getNetworkStatus(),
      getPeers()
    ])
    return {
      status: statusRes.data,
      peers: peersRes.data.peers
    }
  }
)

const networkSlice = createSlice({
  name: 'network',
  initialState: {
    status: {},
    peers: [],
    isLoading: false,
    isInitialLoad: true,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNetworkData.pending, (state) => {
        if (state.isInitialLoad) {
          state.isLoading = true
        }
      })
      .addCase(fetchNetworkData.fulfilled, (state, action) => {
        state.isLoading = false
        state.isInitialLoad = false
        state.status = action.payload.status
        state.peers = action.payload.peers
        state.error = null
      })
      .addCase(fetchNetworkData.rejected, (state, action) => {
        state.isLoading = false
        state.isInitialLoad = false
        state.error = action.error.message
      })
  }
})

export const { clearError } = networkSlice.actions
export default networkSlice.reducer 