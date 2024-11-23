import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBlockDetails, fetchTransactionDetails, clearSearch } from '../store/explorerSlice'
import { useDataPolling } from '../hooks/useDataPolling'
import { fetchBlockchainData } from '../store/blockchainSlice'
import LoadingOverlay from '../components/LoadingOverlay'

export default function Explorer() {
  const dispatch = useDispatch()
  const { searchResults, isLoading, isInitialLoad, error } = useSelector((state) => state.explorer)
  const { chain } = useSelector((state) => state.blockchain)
  const [searchInput, setSearchInput] = useState('')

  useDataPolling(fetchBlockchainData)

  const handleSearch = async () => {
    if (!searchInput.trim()) return

    dispatch(clearSearch())
    try {
      // Try to find block first
      await dispatch(fetchBlockDetails(searchInput))
      if (!error) return

      // If not found, try to find transaction
      await dispatch(fetchTransactionDetails(searchInput))
    } catch (err) {
      // Error handling is done in the slice
    }
  }

  return (
    <>
      <LoadingOverlay isInitialLoad={isInitialLoad} />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Block Explorer</h1>

        {/* Search Bar */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by block hash or transaction hash..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-500">{error}</p>
          )}
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              {searchResults.type === 'block' ? 'Block Details' : 'Transaction Details'}
            </h2>
            {searchResults.type === 'block' ? (
              <div className="space-y-2">
                <p><span className="font-medium">Hash:</span> {searchResults.data.hash}</p>
                <p><span className="font-medium">Previous Hash:</span> {searchResults.data.previous_hash}</p>
                <p><span className="font-medium">Timestamp:</span> {new Date(searchResults.data.timestamp * 1000).toLocaleString()}</p>
                <div>
                  <h3 className="font-medium mt-4 mb-2">Transactions:</h3>
                  <div className="space-y-2">
                    {searchResults.data.transactions.map((tx, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <p><span className="font-medium">From:</span> {tx.sender}</p>
                        <p><span className="font-medium">To:</span> {tx.recipient}</p>
                        <p><span className="font-medium">Amount:</span> {tx.amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p><span className="font-medium">Transaction Hash:</span> {searchResults.data.hash}</p>
                <p><span className="font-medium">From:</span> {searchResults.data.sender}</p>
                <p><span className="font-medium">To:</span> {searchResults.data.recipient}</p>
                <p><span className="font-medium">Amount:</span> {searchResults.data.amount}</p>
                <p><span className="font-medium">Status:</span> 
                  <span className="ml-2 px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
                    Confirmed
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recent Blocks */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Blocks</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Block Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previous Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {chain?.slice(-10).reverse().map((block) => (
                    <tr 
                      key={block.hash}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSearchInput(block.hash)
                        dispatch(fetchBlockDetails(block.hash))
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {block.hash.substring(0, 16)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {block.previous_hash.substring(0, 16)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {block.transactions.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(block.timestamp * 1000).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 