import React from 'react'
import StakingDashboard from '../components/staking/StakingDashboard';
import StakingForm from '../components/staking/StakingForm';
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

function Staking() {
  // Mock data for charts
  const stakingData = [
    { name: 'Jan', tvl: 4000, apy: 12 },
    { name: 'Feb', tvl: 3000, apy: 11 },
    { name: 'Mar', tvl: 2000, apy: 13 },
    { name: 'Apr', tvl: 2780, apy: 12.5 },
    { name: 'May', tvl: 1890, apy: 14 },
    { name: 'Jun', tvl: 2390, apy: 13.2 },
    { name: 'Jul', tvl: 3490, apy: 12.8 },
  ];

  const stakingDistribution = [
    { name: '30 Days', value: 400 },
    { name: '60 Days', value: 300 },
    { name: '90 Days', value: 500 },
    { name: '180 Days', value: 200 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Staking Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Value Locked" value="$1.23B" change="+5.3%" />
        <StatCard title="Current APY" value="12.5%" change="+0.5%" />
        <StatCard title="Total Stakers" value="45.2K" change="+2.1%" />
        <StatCard title="Your Stake" value="1,000 TOKENS" change="+10%" />
      </div>

      {/* TVL Chart */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-medium text-white mb-4">Total Value Locked History</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stakingData}>
              <defs>
                <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="tvl"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorTvl)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* APY Chart */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium text-white mb-4">APY History</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stakingData}>
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
                  dataKey="apy"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Staking Distribution */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium text-white mb-4">Staking Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stakingDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stakingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
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

export default Staking;
