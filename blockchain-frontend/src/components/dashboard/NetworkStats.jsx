import React from 'react';
import { useSelector } from 'react-redux';
import { useWebSocket } from '../../services/websocket';

const NetworkStats = () => {
  const stats = useSelector(state => state.blockchain.networkStats);
  const isConnected = useWebSocket();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      <StatCard
        title="Peers"
        value={stats.peers}
        icon="🌐"
      />
      <StatCard
        title="Blocks"
        value={stats.blocks}
        icon="⛓️"
      />
      <StatCard
        title="Transactions"
        value={stats.transactions}
        icon="💸"
      />
      <StatCard
        title="Mempool"
        value={stats.mempool}
        icon="📦"
      />
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
    <div className="flex items-center justify-between">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-400 text-sm">{title}</span>
    </div>
    <div className="mt-2 text-xl font-bold">{value}</div>
  </div>
);

export default NetworkStats;
