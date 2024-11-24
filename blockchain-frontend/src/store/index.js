import { configureStore } from '@reduxjs/toolkit';
import { apiMiddleware } from './middleware/apiMiddleware';
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
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(apiMiddleware),
});

export default store;
