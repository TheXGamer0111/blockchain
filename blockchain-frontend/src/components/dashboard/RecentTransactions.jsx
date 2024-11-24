import { useEffect, useState } from 'react';
import api from '../../services/api';

function RecentTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get('/transactions/recent');
        setTransactions(response.data);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {transactions.map((tx) => (
            <TransactionItem key={tx.hash} transaction={tx} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function TransactionItem({ transaction }) {
  return (
    <li>
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <div className="flex text-sm">
              <p className="font-medium text-blue-600 truncate">
                {transaction.hash}
              </p>
            </div>
            <div className="mt-2 flex">
              <div className="flex items-center text-sm text-gray-500">
                <span>From: {transaction.from.slice(0, 10)}...</span>
                <span className="mx-2">→</span>
                <span>To: {transaction.to.slice(0, 10)}...</span>
              </div>
            </div>
          </div>
          <div className="ml-2 flex-shrink-0 flex">
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              {transaction.amount} NEXUS
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

export default RecentTransactions;
