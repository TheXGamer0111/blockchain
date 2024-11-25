import { useState, useEffect, useMemo } from 'react';
import { wsService } from '../../services/websocket';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

const ITEMS_PER_PAGE = 10;

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(wsService.getConnectionStatus());
  const [hasInitialData, setHasInitialData] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    const unsubscribe = wsService.subscribe('TRANSACTION_HISTORY', (data) => {
      console.log('Received transaction history:', data);
      setTransactions(data.transactions || []);
      setIsLoading(false);
      setHasInitialData(true);
    });

    if (!hasInitialData && connectionStatus) {
      wsService.sendMessage({ 
        type: 'GET_TRANSACTION_HISTORY',
        data: { page: currentPage, limit: ITEMS_PER_PAGE }
      });
    }

    const statusInterval = setInterval(() => {
      const status = wsService.getConnectionStatus();
      setConnectionStatus(status);
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, [currentPage, hasInitialData, connectionStatus]);

  useEffect(() => {
    if (!connectionStatus && !hasShownToast) {
      toast.info('Connecting to blockchain network...', {
        toastId: 'connecting',
        autoClose: false
      });
      setHasShownToast(true);
    } else if (connectionStatus && hasShownToast) {
      toast.dismiss('connecting');
      setHasShownToast(false);
    }
  }, [connectionStatus, hasShownToast]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        if (!filter) return true;
        const searchTerm = filter.toLowerCase();
        return (
          tx.hash?.toLowerCase().includes(searchTerm) ||
          tx.sender?.toLowerCase().includes(searchTerm) ||
          tx.recipient?.toLowerCase().includes(searchTerm) ||
          tx.amount?.toString().includes(searchTerm)
        );
      })
      .sort((a, b) => {
        const order = sortOrder === 'asc' ? 1 : -1;
        switch (sortBy) {
          case 'amount':
            return (a.amount - b.amount) * order;
          case 'timestamp':
          default:
            return (a.timestamp - b.timestamp) * order;
        }
      });
  }, [transactions, filter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold">Transaction History</h2>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            connectionStatus 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {connectionStatus ? 'Connected' : 'Connecting...'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <select
            className="bg-gray-700 rounded px-3 py-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="timestamp">Time</option>
            <option value="amount">Amount</option>
          </select>
          <button
            className="p-2 rounded hover:bg-gray-700"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
          <input
            type="text"
            placeholder="Search transactions..."
            className="px-3 py-2 bg-gray-700 rounded text-sm w-64"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-gray-400">
            {connectionStatus ? 'Loading transactions...' : 'Connecting to network...'}
          </p>
        </div>
      ) : paginatedTransactions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          {filter ? 'No transactions match your search' : 'No transactions found'}
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedTransactions.map((tx) => (
            <div key={tx.hash} className="bg-gray-700 p-3 rounded">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Time</p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">From</p>
                  <p className="font-mono text-sm truncate">{tx.sender}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">To</p>
                  <p className="font-mono text-sm truncate">{tx.recipient}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Amount</p>
                  <p className="text-sm">{tx.amount} NEXUS</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          <button
            className={`px-3 py-1 rounded ${
              currentPage === 1 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1 
                  ? 'bg-blue-600' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            className={`px-3 py-1 rounded ${
              currentPage === totalPages 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory; 