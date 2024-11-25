import { useEffect, useState } from 'react';
import { wsService } from '../../services/websocket';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

const TransactionNotifications = () => {
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false });

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

  // Filter and sort transactions
  const filteredTransactions = pendingTransactions
    .filter(tx => 
      filter === '' || 
      tx.hash.toLowerCase().includes(filter.toLowerCase()) ||
      tx.sender.toLowerCase().includes(filter.toLowerCase()) ||
      tx.recipient.toLowerCase().includes(filter.toLowerCase())
    )
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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
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
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search transactions..."
              className="px-3 py-1 bg-gray-700 rounded text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <p className="text-gray-400">No pending transactions</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-4 px-3 py-2 bg-gray-700 rounded text-sm font-medium">
            <button 
              className="text-left flex items-center space-x-1"
              onClick={() => handleSort('timestamp')}
            >
              <span>Time</span>
              {sortBy === 'timestamp' && (
                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
            <span>From/To</span>
            <button 
              className="text-left flex items-center space-x-1"
              onClick={() => handleSort('amount')}
            >
              <span>Amount</span>
              {sortBy === 'amount' && (
                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
            <span>Status</span>
          </div>

          {filteredTransactions.map((tx) => (
            <div key={tx.hash} className="bg-gray-700 p-3 rounded hover:bg-gray-600 transition-colors">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-sm">
                  {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                </div>
                <div>
                  <div className="text-sm">
                    <span className="text-gray-400">From: </span>
                    <span className="font-mono truncate">{tx.sender}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">To: </span>
                    <span className="font-mono truncate">{tx.recipient}</span>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {tx.amount} NEXUS
                </div>
                <div>
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300">
                    {tx.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionNotifications; 