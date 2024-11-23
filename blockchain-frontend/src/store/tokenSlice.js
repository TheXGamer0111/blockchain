import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const createToken = createAsyncThunk(
  'token/create',
  async (tokenData) => {
    const response = await fetch('/api/tokens/create', {
      method: 'POST',
      body: JSON.stringify(tokenData)
    })
    return response.data
  }
)

export const getTokenBalance = createAsyncThunk(
  'token/getBalance',
  async ({ tokenAddress, walletAddress }) => {
    const response = await fetch(`/api/tokens/${tokenAddress}/balance/${walletAddress}`)
    return response.data
  }
)

const tokenSlice = createSlice({
  name: 'token',
  initialState: {
    tokens: [],
    balances: {},
    isLoading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createToken.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createToken.fulfilled, (state, action) => {
        state.isLoading = false
        state.tokens.push(action.payload)
      })
      .addCase(createToken.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
      .addCase(getTokenBalance.fulfilled, (state, action) => {
        state.balances[action.payload.tokenAddress] = action.payload.balance
      })
  }
})

export default tokenSlice.reducer 