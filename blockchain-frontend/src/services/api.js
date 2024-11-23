import axios from 'axios'

const API_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Chain operations
export const getChain = () => api.get('/chain')
export const getBlock = (hash) => api.get(`/block/${hash}`)
export const getTransaction = (hash) => api.get(`/transaction/${hash}`)

// Wallet operations
export const getBalance = (address) => api.get(`/balance/${address}`)
export const createTransaction = (data) => api.post('/transactions/new', data)
export const getAddressTransactions = (address) => api.get(`/address/${address}/transactions`)
export const createWallet = () => api.post('/wallet/create')

// Mining operations
export const mineBlock = () => api.get('/mine')
export const getMempool = () => api.get('/mempool')

// Network operations
export const getNetworkStatus = () => api.get('/network/status')
export const getPeers = () => api.get('/network/peers')

// Contract operations
export const deployContract = (data) => api.post('/contracts/deploy', data)
export const callContract = (address, functionName, args) => 
  api.post(`/contracts/${address}/call`, { function_name: functionName, args })

export default api 