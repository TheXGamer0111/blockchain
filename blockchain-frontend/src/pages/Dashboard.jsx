import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import BlockVisualization from '../components/BlockVisualization'
import { fetchBlockchainData, mineNewBlock, setSelectedBlock } from '../store/blockchainSlice'
import { useDataPolling } from '../hooks/useDataPolling'
import LoadingOverlay from '../components/LoadingOverlay'

export default function Dashboard() {
  const dispatch = useDispatch()
  const { chain, networkStatus, isLoading, isInitialLoad, error, isMining, selectedBlock } = useSelector(
    (state) => state.blockchain
  )

  useDataPolling(fetchBlockchainData)

  const handleMine = async () => {
    if (isMining) return
    await dispatch(mineNewBlock())
    dispatch(fetchBlockchainData())
  }

  return (
    <>
      <LoadingOverlay isInitialLoad={isInitialLoad} />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={handleMine}
            disabled={isMining}
            className={`px-4 py-2 rounded-md ${
              isMining 
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white`}
          >
            {isMining ? 'Mining...' : 'Mine Block'}
          </button>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700">Blocks</h2>
            <p className="text-3xl font-bold text-indigo-600">{chain?.length || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700">Peers</h2>
            <p className="text-3xl font-bold text-indigo-600">{networkStatus?.peers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700">Pending Transactions</h2>
            <p className="text-3xl font-bold text-indigo-600">
              {networkStatus?.pending_transactions || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700">Mining Status</h2>
            <p className="text-xl font-semibold text-green-600">
              {networkStatus?.is_mining ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>

        {/* Blockchain Visualization */}
        <BlockVisualization />

        {/* Block Details Modal */}
        {selectedBlock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full">
              <h2 className="text-xl font-semibold mb-4">Block Details</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Hash:</span> {selectedBlock.hash}</p>
                <p><span className="font-medium">Previous Hash:</span> {selectedBlock.previous_hash}</p>
                <p><span className="font-medium">Timestamp:</span> {new Date(selectedBlock.timestamp * 1000).toLocaleString()}</p>
                <div>
                  <h3 className="font-medium">Transactions:</h3>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {selectedBlock.transactions.map((tx, i) => (
                      <div key={i} className="p-2 bg-gray-50 rounded mb-2">
                        <p>From: {tx.sender}</p>
                        <p>To: {tx.recipient}</p>
                        <p>Amount: {tx.amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => dispatch(setSelectedBlock(null))}
                className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
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
                      Transactions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {chain?.slice(-5).reverse().map((block) => (
                    <tr 
                      key={block?.hash || 'unknown'}
                      onClick={() => dispatch(setSelectedBlock(block))}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {block?.hash ? `${block.hash.substring(0, 16)}...` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {block?.transactions?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {block?.timestamp ? new Date(block.timestamp * 1000).toLocaleString() : 'N/A'}
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