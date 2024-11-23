import { configureStore } from '@reduxjs/toolkit'
import blockchainReducer from './blockchainSlice'
import walletReducer from './walletSlice'
import explorerReducer from './explorerSlice'
import networkReducer from './networkSlice'
import contractsReducer from './contractsSlice'
import analyticsReducer from './analyticsSlice'
import tokenReducer from './tokenSlice'
import multiSigReducer from './multiSigSlice'

// Custom middleware to throttle requests
const throttleMiddleware = () => (next) => {
  const throttleMap = new Map()
  
  return (action) => {
    if (action.type.endsWith('/pending')) {
      const baseType = action.type.split('/pending')[0]
      const lastCall = throttleMap.get(baseType)
      const now = Date.now()
      
      if (lastCall && now - lastCall < 5000) { // 5 second minimum between similar requests
        return
      }
      
      throttleMap.set(baseType, now)
    }
    return next(action)
  }
}

export const store = configureStore({
  reducer: {
    blockchain: blockchainReducer,
    wallet: walletReducer,
    explorer: explorerReducer,
    network: networkReducer,
    contracts: contractsReducer,
    analytics: analyticsReducer,
    token: tokenReducer,
    multiSig: multiSigReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(throttleMiddleware)
})