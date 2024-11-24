import { configureStore } from '@reduxjs/toolkit';
import blockchainReducer from './slices/blockchainSlice';
import walletReducer from './slices/walletSlice';
import stakingReducer from './slices/stakingSlice';
import governanceReducer from './slices/governanceSlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    blockchain: blockchainReducer,
    wallet: walletReducer,
    staking: stakingReducer,
    governance: governanceReducer,
    dashboard: dashboardReducer,
  },
 
});

export default store;
