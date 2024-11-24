import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNetworkStats } from '../../store/slices/blockchainSlice';

function NetworkStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Blocks" value="1,234,567" />
      <StatCard title="Transactions" value="5,678,901" />
      <StatCard title="Active Validators" value="100" />
      <StatCard title="Network Hash Rate" value="123.45 TH/s" />
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default NetworkStats;
