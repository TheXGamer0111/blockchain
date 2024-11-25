import { useEffect, useState, useMemo } from 'react';
import { wsService } from '../../services/websocket';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import TransactionModal from './TransactionModal';
import { formatAddress } from '../../utils/blockchain';

const TransactionNotifications = () => {
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false });
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Memoize filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    return pendingTransactions
      .filter(tx => {
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
            return (a.timestamp - b.timestamp) * order;
          default:
            return 0;
        }
      });
  }, [pendingTransactions, filter, sortBy, sortOrder]);

  // Calculate stats based on filtered transactions
  const stats = useMemo(() => {
    const total = filteredTransactions.length;
    const volume = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const average = total > 0 ? volume / total : 0;
    return { total, volume, average };
  }, [filteredTransactions]);

  useEffect(() => {
    // Subscribe to transaction updates
    const unsubscribe = wsService.subscribe('TRANSACTION_UPDATE', (data) => {
      console.log('Received transaction update:', data);
      setPendingTransactions(data.pendingTransactions || []);
      
      // Show toast notification for new transactions
      if (data.pendingTransactions?.length > pendingTransactions.length) {
        const newTransactions = data.pendingTransactions.slice(pendingTransactions.length);
        newTransactions.forEach(tx => {
          toast.info(
            <div>
              <p className="font-bold">New Transaction</p>
              <p className="text-sm truncate">From: {tx.sender}</p>
              <p className="text-sm truncate">To: {tx.recipient}</p>
              <p className="text-sm">Amount: {tx.amount} NEXUS</p>
            </div>
          );
        });
      }
    });

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      const status = wsService.getDetailedStatus();
      setConnectionStatus(status);
    }, 1000);

    // Wait for connection before sending subscription message
    wsService.waitForConnection(() => {
      try {
        wsService.sendMessage({ type: 'SUBSCRIBE_TRANSACTIONS' });
        console.log('Sent subscription message');
      } catch (error) {
        console.error('Failed to subscribe to transactions:', error);
        toast.error('Failed to connect to blockchain network');
      }
    });

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, [pendingTransactions]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleTransactionClick = (tx) => {
    setSelectedTransaction(tx);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-gray-400">Pending Transactions</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-gray-400">Total Volume</p>
          <p className="text-2xl font-bold">{stats.volume.toFixed(2)} NEXUS</p>
        </div>
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-gray-400">Average Amount</p>
          <p className="text-2xl font-bold">{stats.average.toFixed(2)} NEXUS</p>
        </div>
      </div>

      {/* Search and Status Section */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Pending Transactions</h2>
        <div className="flex items-center space-x-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            connectionStatus.isConnected 
              ? 'bg-green-100 text-green-800' 
              : connectionStatus.reconnecting
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {connectionStatus.isConnected 
              ? 'Connected' 
              : connectionStatus.reconnecting
              ? 'Reconnecting...'
              : 'Disconnected'}
          </span>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by hash, address, or amount..."
              className="px-3 py-2 bg-gray-700 rounded text-sm w-64 pr-8"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <button
                className="absolute right-2 top-2 text-gray-400 hover:text-white"
                onClick={() => setFilter('')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {filter 
              ? 'No transactions match your search'
              : 'No pending transactions'}
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div 
              key={tx.hash}
              className="bg-gray-700 p-3 rounded hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={() => setSelectedTransaction(tx)}
            >
              <div className="grid grid-cols-4 gap-4">
                <div className="text-sm">
                  {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                </div>
                <div>
                  <div className="text-sm">
                    <span className="text-gray-400">From: </span>
                    <span className="font-mono">{formatAddress(tx.sender, 6)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">To: </span>
                    <span className="font-mono">{formatAddress(tx.recipient, 6)}</span>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {tx.amount.toFixed(2)} NEXUS
                </div>
                <div>
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300">
                    {tx.status || 'pending'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transaction Modal */}
      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
};

export default TransactionNotifications; 