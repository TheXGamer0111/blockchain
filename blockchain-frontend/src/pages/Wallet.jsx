import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  fetchWalletData, 
  sendTransaction, 
  createNewWallet 
} from '../store/walletSlice'
import { useDataPolling } from '../hooks/useDataPolling'
import LoadingOverlay from '../components/LoadingOverlay'

export default function Wallet() {
  const dispatch = useDispatch()
  const { balance, transactions, isLoading, isInitialLoad, error, success } = useSelector(
    (state) => state.wallet
  )
  const [formData, setFormData] = useState({
    recipient: '',
    amount: ''
  })

  // Get wallet address from local storage
  const walletAddress = localStorage.getItem('walletAddress')

  useDataPolling(() => fetchWalletData(walletAddress), walletAddress ? 5000 : null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!walletAddress) return

    await dispatch(sendTransaction({
      sender: walletAddress,
      recipient: formData.recipient,
      amount: parseFloat(formData.amount)
    }))

    setFormData({ recipient: '', amount: '' })
    dispatch(fetchWalletData(walletAddress))
  }

  const handleCreateWallet = async () => {
    const result = await dispatch(createNewWallet())
    if (result.payload?.address) {
      localStorage.setItem('walletAddress', result.payload.address)
      window.location.reload() // Refresh to load new wallet data
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <>
      <LoadingOverlay isInitialLoad={isInitialLoad} />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Wallet</h1>

        {!walletAddress ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Create New Wallet</h2>
            <button
              onClick={handleCreateWallet}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Wallet Info */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Wallet Information</h2>
              <div className="space-y-2">
                <p className="text-gray-600">Address: <span className="font-mono">{walletAddress}</span></p>
                <p className="text-gray-600">Balance: <span className="font-bold text-indigo-600">{balance} coins</span></p>
              </div>
            </div>

            {/* Send Transaction Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Send Transaction</h2>
              {error && <div className="text-red-500 mb-4">{error}</div>}
              {success && <div className="text-green-500 mb-4">{success}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Recipient Address</label>
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Send Transaction
                </button>
              </form>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From/To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((tx) => (
                        <tr key={tx.hash}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tx.sender === walletAddress ? 'Sent' : 'Received'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tx.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tx.sender === walletAddress ? tx.recipient : tx.sender}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Confirmed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
} 