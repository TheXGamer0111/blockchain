import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getBalance, createWallet, getAddressTransactions, createTransaction } from '../services/api'

export const fetchWalletData = createAsyncThunk(
  'wallet/fetchData',
  async (address) => {
    const [balanceRes, txRes] = await Promise.all([
      getBalance(address),
      getAddressTransactions(address)
    ])
    return {
      balance: balanceRes.data.balance,
      transactions: txRes.data.transactions
    }
  }
)

export const createNewWallet = createAsyncThunk(
  'wallet/createWallet',
  async () => {
    const response = await createWallet()
    return response.data
  }
)

export const sendTransaction = createAsyncThunk(
  'wallet/sendTransaction',
  async (transactionData) => {
    const response = await createTransaction(transactionData)
    return response.data
  }
)

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance: 0,
    transactions: [],
    isLoading: false,
    isInitialLoad: true,
    error: null,
    success: null
  },
  reducers: {
    clearMessages: (state) => {
      state.error = null
      state.success = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletData.pending, (state) => {
        if (state.isInitialLoad) {
          state.isLoading = true
        }
      })
      .addCase(fetchWalletData.fulfilled, (state, action) => {
        state.isLoading = false
        state.isInitialLoad = false
        state.balance = action.payload.balance
        state.transactions = action.payload.transactions
        state.error = null
      })
      .addCase(fetchWalletData.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
      .addCase(sendTransaction.pending, (state) => {
        state.isLoading = true
      })
      .addCase(sendTransaction.fulfilled, (state) => {
        state.isLoading = false
        state.success = 'Transaction sent successfully'
        state.error = null
      })
      .addCase(sendTransaction.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
      .addCase(createNewWallet.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createNewWallet.fulfilled, (state) => {
        state.isLoading = false
        state.success = 'Wallet created successfully'
        state.error = null
      })
      .addCase(createNewWallet.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
  }
})

export const { clearMessages } = walletSlice.actions
export default walletSlice.reducer 