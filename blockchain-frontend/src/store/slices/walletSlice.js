import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Web3 from 'web3';
import TokenService from '../../services/TokenService';
import { toast } from 'react-toastify';

// Common tokens on Ethereum mainnet
const COMMON_TOKENS = {
  'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f',
  'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
};

// Initialize Web3
let web3;
if (window.ethereum) {
  web3 = new Web3(window.ethereum);
}

// Async thunks
export const connectWallet = createAsyncThunk(
  'wallet/connect',
  async (_, { rejectWithValue }) => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask!');
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      const web3 = new Web3(window.ethereum);
      const balance = await web3.eth.getBalance(address);
      const networkId = await web3.eth.net.getId();

      return {
        address,
        balance: web3.utils.fromWei(balance, 'ether'),
        networkId: Number(networkId)
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const disconnectWallet = createAsyncThunk(
  'wallet/disconnect',
  async (_, { dispatch }) => {
    try {
      // Clear any Web3 instance state
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }

      // Clear any local storage items
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('connectedAddress');

      // Don't show toast message here since it's shown in the component
      return null;
    } catch (error) {
      // Don't show error toast here
      throw error;
    }
  }
);

export const sendTransaction = createAsyncThunk(
  'wallet/sendTransaction',
  async ({ to, amount }, { getState, rejectWithValue }) => {
    try {
      const { address } = getState().wallet;
      
      const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
      
      const transaction = {
        from: address,
        to,
        value: amountInWei,
        gas: '21000', // Basic transaction gas
      };

      const receipt = await web3.eth.sendTransaction(transaction);
      return receipt;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadTokenBalances = createAsyncThunk(
  'wallet/loadTokenBalances',
  async (address, { rejectWithValue }) => {
    try {
      const balances = {};
      for (const [symbol, tokenAddress] of Object.entries(COMMON_TOKENS)) {
        const balance = await TokenService.getTokenBalance(tokenAddress, address);
        const tokenInfo = await TokenService.getTokenInfo(tokenAddress);
        balances[tokenAddress] = {
          symbol,
          balance,
          ...tokenInfo,
        };
      }
      return balances;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const transferToken = createAsyncThunk(
  'wallet/transferToken',
  async ({ tokenAddress, to, amount }, { getState, rejectWithValue }) => {
    try {
      const { address } = getState().wallet;
      const receipt = await TokenService.transferToken(tokenAddress, address, to, amount);
      
      // Show success notification
      toast.success('Token transfer successful!');
      
      return receipt;
    } catch (error) {
      toast.error(`Token transfer failed: ${error.message}`);
      return rejectWithValue(error.message);
    }
  }
);

export const switchNetwork = createAsyncThunk(
  'wallet/switchNetwork',
  async (chainId, { rejectWithValue }) => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask!');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      }).catch(async (switchError) => {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          const networks = {
            '0x89': {
              chainId: '0x89',
              chainName: 'Polygon',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: ['https://polygon-rpc.com/'],
              blockExplorerUrls: ['https://polygonscan.com/']
            },
            '0x38': {
              chainId: '0x38',
              chainName: 'Binance Smart Chain',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
              },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/']
            },
            // Add other networks as needed
          };

          // If the network isn't added, try to add it
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networks[chainId]],
          });
        } else {
          throw switchError;
        }
      });

      // Ensure networkId is converted to a regular number
      const networkId = await window.ethereum.request({ method: 'eth_chainId' });
      return Number(networkId); // Convert hex to number
    } catch (error) {
      toast.error(`Failed to switch network: ${error.message}`);
      return rejectWithValue(error.message);
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    address: null,
    balance: '0',
    networkId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    loading: false,
    transactions: [],
    pendingTransactions: [],
    tokens: {},
    tokenTransactions: [],
    loadingTokens: false,
    tokenError: null,
  },
  reducers: {
    updateBalance: (state, action) => {
      state.balance = action.payload;
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
    },
    addPendingTransaction: (state, action) => {
      state.pendingTransactions.unshift(action.payload);
    },
    removePendingTransaction: (state, action) => {
      state.pendingTransactions = state.pendingTransactions.filter(
        tx => tx.hash !== action.payload
      );
    },
    addTokenTransaction: (state, action) => {
      state.tokenTransactions.unshift(action.payload);
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateNetworkId: (state, action) => {
      state.networkId = Number(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Connect wallet cases
      .addCase(connectWallet.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
        state.loading = true;
      })
      .addCase(connectWallet.fulfilled, (state, action) => {
        state.isConnecting = false;
        state.isConnected = true;
        state.address = action.payload.address;
        state.balance = action.payload.balance;
        state.networkId = action.payload.networkId;
        state.error = null;
        state.loading = false;
      })
      .addCase(connectWallet.rejected, (state, action) => {
        state.isConnecting = false;
        state.isConnected = false;
        state.error = action.payload;
        state.loading = false;
      })
      // Disconnect wallet cases
      .addCase(disconnectWallet.pending, (state) => {
        state.loading = true;
      })
      .addCase(disconnectWallet.fulfilled, (state) => {
        return {
          ...state,
          isConnected: false,
          isConnecting: false,
          address: null,
          balance: '0',
          networkId: null,
          error: null,
          loading: false,
          transactions: [],
          pendingTransactions: [],
          tokens: {},
          tokenTransactions: [],
          loadingTokens: false,
          tokenError: null,
        };
      })
      .addCase(disconnectWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Send transaction
      .addCase(sendTransaction.pending, (state, action) => {
        // Add to pending transactions
      })
      .addCase(sendTransaction.fulfilled, (state, action) => {
        // Move from pending to completed transactions
      })
      .addCase(sendTransaction.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(loadTokenBalances.pending, (state) => {
        state.loadingTokens = true;
        state.tokenError = null;
      })
      .addCase(loadTokenBalances.fulfilled, (state, action) => {
        state.loadingTokens = false;
        state.tokens = action.payload;
      })
      .addCase(loadTokenBalances.rejected, (state, action) => {
        state.loadingTokens = false;
        state.tokenError = action.payload;
      })
      .addCase(transferToken.fulfilled, (state, action) => {
        // Update token balances after successful transfer
        state.tokenTransactions.unshift(action.payload);
      })
      .addCase(switchNetwork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(switchNetwork.fulfilled, (state, action) => {
        state.loading = false;
        state.networkId = Number(action.payload); // Ensure it's a regular number
      })
      .addCase(switchNetwork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  updateBalance, 
  addTransaction, 
  addPendingTransaction, 
  removePendingTransaction, 
  addTokenTransaction,
  setError,
  updateNetworkId
} = walletSlice.actions;

export default walletSlice.reducer; 