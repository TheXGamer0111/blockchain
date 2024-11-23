import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getChain, getNetworkStatus, getMempool, mineBlock } from '../services/api'

export const fetchBlockchainData = createAsyncThunk(
  'blockchain/fetchData',
  async () => {
    const [chainRes, statusRes, mempoolRes] = await Promise.all([
      getChain(),
      getNetworkStatus(),
      getMempool()
    ])
    return {
      chain: chainRes.data.chain,
      networkStatus: statusRes.data,
      mempool: mempoolRes.data.pending_transactions
    }
  }
)

export const mineNewBlock = createAsyncThunk(
  'blockchain/mineBlock',
  async () => {
    const response = await mineBlock()
    return response.data
  }
)

const blockchainSlice = createSlice({
  name: 'blockchain',
  initialState: {
    chain: [],
    networkStatus: {},
    mempool: [],
    selectedBlock: null,
    isLoading: false,
    isInitialLoad: true,
    error: null,
    isMining: false
  },
  reducers: {
    setSelectedBlock: (state, action) => {
      state.selectedBlock = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlockchainData.pending, (state) => {
        if (state.isInitialLoad) {
          state.isLoading = true
        }
      })
      .addCase(fetchBlockchainData.fulfilled, (state, action) => {
        state.isLoading = false
        state.isInitialLoad = false
        state.chain = action.payload.chain
        state.networkStatus = action.payload.networkStatus
        state.mempool = action.payload.mempool
        state.error = null
      })
      .addCase(fetchBlockchainData.rejected, (state, action) => {
        state.isLoading = false
        state.isInitialLoad = false
        state.error = action.error.message
      })
      .addCase(mineNewBlock.pending, (state) => {
        state.isMining = true
      })
      .addCase(mineNewBlock.fulfilled, (state) => {
        state.isMining = false
      })
      .addCase(mineNewBlock.rejected, (state, action) => {
        state.isMining = false
        state.error = action.error.message
      })
  }
})

export const { setSelectedBlock, clearError } = blockchainSlice.actions
export default blockchainSlice.reducer 