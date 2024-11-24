import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStakingStats } from '../../store/slices/stakingSlice';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function StakingStats() {
  const dispatch = useDispatch();
  const { stakingStats, loading } = useSelector((state) => state.staking);

  useEffect(() => {
    dispatch(fetchStakingStats());
    const interval = setInterval(() => {
      dispatch(fetchStakingStats());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [dispatch]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Staking Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Total Value Locked"
          value={`${stakingStats.totalValueLocked.toLocaleString()} NEXUS`}
          change={stakingStats.tvlChange}
        />
        <StatCard
          title="Average APY"
          value={`${stakingStats.averageApy}%`}
          change={stakingStats.apyChange}
        />
        <StatCard
          title="Total Stakers"
          value={stakingStats.totalStakers.toLocaleString()}
          change={stakingStats.stakersChange}
        />
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={stakingStats.history}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="tvl"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ title, value, change }) {
  const isPositive = change > 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const changeIcon = isPositive ? '↑' : '↓';

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
      <p className={`mt-2 text-sm ${changeColor}`}>
        {changeIcon} {Math.abs(change)}% from last week
      </p>
    </div>
  );
}

export default StakingStats; 