import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const createMultiSigWallet = createAsyncThunk(
  'multiSig/create',
  async ({ owners, requiredSignatures }) => {
    const response = await fetch('/api/multisig/create', {
      method: 'POST',
      body: JSON.stringify({ owners, requiredSignatures })
    })
    return response.data
  }
)

export const proposeTransaction = createAsyncThunk(
  'multiSig/propose',
  async ({ walletAddress, transaction }) => {
    const response = await fetch(`/api/multisig/${walletAddress}/propose`, {
      method: 'POST',
      body: JSON.stringify(transaction)
    })
    return response.data
  }
)

const multiSigSlice = createSlice({
  name: 'multiSig',
  initialState: {
    wallets: [],
    pendingTransactions: [],
    isLoading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createMultiSigWallet.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createMultiSigWallet.fulfilled, (state, action) => {
        state.isLoading = false
        state.wallets.push(action.payload)
      })
      .addCase(createMultiSigWallet.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
      .addCase(proposeTransaction.fulfilled, (state, action) => {
        state.pendingTransactions.push(action.payload)
      })
  }
})

export default multiSigSlice.reducer 