// New component: blockchain-frontend/src/components/tokens/TokenManager.jsx
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createToken, getTokenBalance } from '../../store/tokenSlice'

export default function TokenManager() {
  const dispatch = useDispatch()
  const { tokens, balances, isLoading, error } = useSelector(state => state.token)
  const [tokenForm, setTokenForm] = useState({
    name: '',
    symbol: '',
    totalSupply: '',
    decimals: 18
  })
  const [selectedToken, setSelectedToken] = useState(null)

  const handleCreateToken = async (e) => {
    e.preventDefault()
    try {
      await dispatch(createToken(tokenForm)).unwrap()
      setTokenForm({ name: '', symbol: '', totalSupply: '', decimals: 18 })
    } catch (err) {
      console.error('Failed to create token:', err)
    }
  }

  const handleTokenSelect = (token) => {
    setSelectedToken(token)
    if (token) {
      dispatch(getTokenBalance({
        tokenAddress: token.address,
        walletAddress: localStorage.getItem('walletAddress')
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Token Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Create New Token</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        <form onSubmit={handleCreateToken} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Token Name</label>
            <input
              type="text"
              value={tokenForm.name}
              onChange={(e) => setTokenForm({...tokenForm, name: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Symbol</label>
            <input
              type="text"
              value={tokenForm.symbol}
              onChange={(e) => setTokenForm({...tokenForm, symbol: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Supply</label>
            <input
              type="number"
              value={tokenForm.totalSupply}
              onChange={(e) => setTokenForm({...tokenForm, totalSupply: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Decimals</label>
            <input
              type="number"
              value={tokenForm.decimals}
              onChange={(e) => setTokenForm({...tokenForm, decimals: parseInt(e.target.value)})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              min="0"
              max="18"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? 'Creating...' : 'Create Token'}
          </button>
        </form>
      </div>

      {/* Token List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Your Tokens</h2>
        <div className="space-y-4">
          {tokens.map(token => (
            <div
              key={token.address}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                selectedToken?.address === token.address ? 'border-indigo-500' : 'border-gray-200'
              }`}
              onClick={() => handleTokenSelect(token)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{token.name}</h3>
                  <p className="text-sm text-gray-500">{token.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Supply</p>
                  <p className="font-medium">{token.totalSupply}</p>
                </div>
              </div>
              {selectedToken?.address === token.address && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">Your Balance</p>
                  <p className="text-lg font-medium">
                    {balances[token.address] || '0'} {token.symbol}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}