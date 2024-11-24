import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';

function TransactionHistory() {
  const { transactions, pendingTransactions } = useSelector((state) => state.wallet);

  const renderTransaction = (tx, isPending = false) => (
    <div key={tx.hash} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full ${
          tx.from.toLowerCase() === address.toLowerCase() ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {tx.from.toLowerCase() === address.toLowerCase() ? '-' : '+'}
        </div>
        <div>
          <p className="text-white font-medium">
            {tx.from.toLowerCase() === address.toLowerCase() ? 'Sent' : 'Received'}
          </p>
          <p className="text-sm text-gray-400">
            {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-white">{tx.value} ETH</p>
        {isPending ? (
          <span className="text-yellow-500 text-sm">Pending</span>
        ) : (
          <a
            href={`https://etherscan.io/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 text-sm hover:text-indigo-300"
          >
            View on Etherscan
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {pendingTransactions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Pending Transactions</h3>
          <div className="space-y-2">
            {pendingTransactions.map(tx => renderTransaction(tx, true))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-white mb-2">Transaction History</h3>
        <div className="space-y-2">
          {transactions.length > 0 ? (
            transactions.map(tx => renderTransaction(tx))
          ) : (
            <p className="text-gray-400">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionHistory; 