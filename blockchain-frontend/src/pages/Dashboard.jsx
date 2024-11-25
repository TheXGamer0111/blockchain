import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar
} from 'recharts';
import { fetchDashboardData } from '../store/slices/dashboardSlice';
import GovernanceWidget from '../components/dashboard/GovernanceWidget';
import BlockchainStatus from '../components/blockchain/BlockchainStatus';

function Dashboard() {
  const dispatch = useDispatch();
  const { stats, priceData, volumeData, loading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error loading dashboard data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BlockchainStatus />
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Value Locked" value={stats.tvl} change="+5.3%" />
        <StatCard title="24h Volume" value={stats.volume24h} change="-2.1%" />
        <StatCard title="Active Users" value={stats.activeUsers} change="+12.3%" />
        <StatCard title="Network TPS" value={stats.networkTps} change="+8.7%" />
      </div>

      {/* Price Chart */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-medium text-white mb-4">Price History</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volume and Transactions Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium text-white mb-4">Trading Volume</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="volume" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium text-white mb-4">Transaction History</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <GovernanceWidget />
    </div>
  );
}

function StatCard({ title, value, change }) {
  const isPositive = change?.startsWith('+');
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {change && (
        <p className={`mt-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {change}
        </p>
      )}
    </div>
  );
}

export default Dashboard;
