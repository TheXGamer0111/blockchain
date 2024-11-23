import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { deployContract, callContract } from '../services/api'

export const deployNewContract = createAsyncThunk(
  'contracts/deploy',
  async (contractData) => {
    const response = await deployContract(contractData)
    return response.data
  }
)

export const callContractFunction = createAsyncThunk(
  'contracts/call',
  async ({ address, functionName, args }) => {
    const response = await callContract(address, functionName, args)
    return response.data
  }
)

const contractsSlice = createSlice({
  name: 'contracts',
  initialState: {
    deployedContracts: [],
    selectedContract: null,
    lastResult: null,
    isLoading: false,
    error: null,
    success: null
  },
  reducers: {
    clearMessages: (state) => {
      state.error = null
      state.success = null
    },
    setSelectedContract: (state, action) => {
      state.selectedContract = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(deployNewContract.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deployNewContract.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = 'Contract deployed successfully'
        state.deployedContracts.push({
          address: action.payload.contract_address,
          timestamp: Date.now()
        })
      })
      .addCase(deployNewContract.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
      .addCase(callContractFunction.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(callContractFunction.fulfilled, (state, action) => {
        state.isLoading = false
        state.lastResult = action.payload.result
        state.success = 'Function called successfully'
      })
      .addCase(callContractFunction.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
  }
})

export const { clearMessages, setSelectedContract } = contractsSlice.actions
export default contractsSlice.reducer 