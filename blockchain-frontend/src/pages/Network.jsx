import { useDataPolling } from '../hooks/useDataPolling'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNetworkData } from '../store/networkSlice'
import LoadingOverlay from '../components/LoadingOverlay'

export default function Network() {
  const dispatch = useDispatch()
  const { status, peers, isLoading, isInitialLoad, error } = useSelector((state) => state.network)

  useDataPolling(fetchNetworkData)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <>
      <LoadingOverlay isInitialLoad={isInitialLoad} />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Network Status</h1>

        {/* Network Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700">Node Address</h2>
            <p className="text-xl font-mono mt-2">{status?.node_address}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700">Connected Peers</h2>
            <p className="text-3xl font-bold text-indigo-600">{peers?.length || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700">Network Status</h2>
            <p className={`text-xl font-semibold ${status?.is_mining ? 'text-green-600' : 'text-yellow-600'}`}>
              {status?.is_mining ? 'Mining' : 'Idle'}
            </p>
          </div>
        </div>

        {/* Network Stats */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Network Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700">Blockchain</h3>
                <dl className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Total Blocks:</dt>
                    <dd className="text-sm font-medium">{status?.blocks || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Pending Transactions:</dt>
                    <dd className="text-sm font-medium">{status?.pending_transactions || 0}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700">Performance</h3>
                <dl className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Mining Status:</dt>
                    <dd className="text-sm font-medium">{status?.is_mining ? 'Active' : 'Inactive'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Network Type:</dt>
                    <dd className="text-sm font-medium">TestNet</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Peer List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Connected Peers</h2>
            {peers?.length === 0 ? (
              <p className="text-gray-500">No peers connected</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Peer ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Seen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {peers.map((peer) => (
                      <tr key={peer}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {peer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Just now
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 