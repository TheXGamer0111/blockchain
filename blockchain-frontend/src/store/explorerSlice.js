import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getBlock, getTransaction } from '../services/api'

export const fetchBlockDetails = createAsyncThunk(
  'explorer/fetchBlock',
  async (hash) => {
    const response = await getBlock(hash)
    return response.data
  }
)

export const fetchTransactionDetails = createAsyncThunk(
  'explorer/fetchTransaction',
  async (hash) => {
    const response = await getTransaction(hash)
    return response.data
  }
)

const explorerSlice = createSlice({
  name: 'explorer',
  initialState: {
    selectedBlock: null,
    selectedTransaction: null,
    searchResults: null,
    isLoading: false,
    isInitialLoad: true,
    error: null
  },
  reducers: {
    clearSearch: (state) => {
      state.searchResults = null
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlockDetails.pending, (state) => {
        if (state.isInitialLoad) {
          state.isLoading = true
        }
      })
      .addCase(fetchBlockDetails.fulfilled, (state, action) => {
        state.isLoading = false
        state.isInitialLoad = false
        state.selectedBlock = action.payload
        state.searchResults = { type: 'block', data: action.payload }
      })
      .addCase(fetchBlockDetails.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
      .addCase(fetchTransactionDetails.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTransactionDetails.fulfilled, (state, action) => {
        state.isLoading = false
        state.selectedTransaction = action.payload
        state.searchResults = { type: 'transaction', data: action.payload }
      })
      .addCase(fetchTransactionDetails.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
  }
})

export const { clearSearch } = explorerSlice.actions
export default explorerSlice.reducer 