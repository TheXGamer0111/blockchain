import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';

function WalletActivity() {
  const { transactions, tokenTransactions } = useSelector((state) => state.wallet);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Combine and sort all transactions
    const allActivities = [
      ...transactions.map(tx => ({
        ...tx,
        type: 'ETH',
        timestamp: new Date(tx.timestamp)
      })),
      ...tokenTransactions.map(tx => ({
        ...tx,
        type: 'TOKEN',
        timestamp: new Date(tx.timestamp)
      }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    setActivities(allActivities);
  }, [transactions, tokenTransactions]);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div
              key={activity.hash}
              className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  activity.type === 'ETH' ? 'bg-blue-500' : 'bg-purple-500'
                }`}>
                  {activity.type === 'ETH' ? 'Ξ' : 'T'}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {activity.type === 'ETH' ? 'ETH Transfer' : `${activity.symbol} Transfer`}
                  </p>
                  <p className="text-sm text-gray-400">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white">
                  {activity.value} {activity.type === 'ETH' ? 'ETH' : activity.symbol}
                </p>
                <a
                  href={`https://etherscan.io/tx/${activity.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-400 hover:text-indigo-300"
                >
                  View on Etherscan
                </a>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center">No recent activity</p>
        )}
      </div>
    </div>
  );
}

export default WalletActivity; 