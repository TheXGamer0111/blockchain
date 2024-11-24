import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
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

function Governance() {
  // Mock data for charts
  const proposalData = [
    { name: 'Jan', proposals: 12, participation: 75 },
    { name: 'Feb', proposals: 8, participation: 82 },
    { name: 'Mar', proposals: 15, participation: 68 },
    { name: 'Apr', proposals: 10, participation: 71 },
    { name: 'May', proposals: 14, participation: 85 },
    { name: 'Jun', proposals: 11, participation: 78 },
    { name: 'Jul', proposals: 13, participation: 80 },
  ];

  const proposalTypes = [
    { name: 'Protocol Upgrade', value: 30 },
    { name: 'Parameter Change', value: 25 },
    { name: 'Treasury', value: 20 },
    { name: 'Other', value: 25 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Governance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Proposals" value="5" change="+2" />
        <StatCard title="Total Proposals" value="156" />
        <StatCard title="Participation Rate" value="78.5%" change="+3.2%" />
        <StatCard title="Your Voting Power" value="12,500" />
      </div>

      {/* Proposals History */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-medium text-white mb-4">Proposal History</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={proposalData}>
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
              <Bar dataKey="proposals" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Participation Rate */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium text-white mb-4">Participation Rate</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={proposalData}>
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
                  dataKey="participation"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Proposal Types */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium text-white mb-4">Proposal Types</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={proposalTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {proposalTypes.map((entry, index) => (
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

      {/* Active Proposals List */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-medium text-white mb-4">Active Proposals</h2>
        <div className="space-y-4">
          {/* Add your proposals list here */}
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

export default Governance;
