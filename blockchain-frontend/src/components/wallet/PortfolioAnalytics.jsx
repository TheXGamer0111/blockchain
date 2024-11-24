import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

function PortfolioAnalytics() {
  const { tokens } = useSelector((state) => state.wallet);
  const [timeRange, setTimeRange] = useState('1W');
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data generation
  useEffect(() => {
    const generateMockData = () => {
      const ranges = {
        '1D': 24,
        '1W': 7,
        '1M': 30,
        '3M': 90,
        '1Y': 365
      };

      const dataPoints = ranges[timeRange];
      const mockData = [];
      let value = 10000; // Starting value

      for (let i = 0; i < dataPoints; i++) {
        value = value * (1 + (Math.random() * 0.1 - 0.05)); // Random change between -5% and 5%
        mockData.push({
          timestamp: new Date(Date.now() - (dataPoints - i) * 86400000).toISOString(),
          value: value.toFixed(2)
        });
      }

      setPortfolioData(mockData);
      setLoading(false);
    };

    generateMockData();
  }, [timeRange]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const assetAllocation = Object.entries(tokens).map(([symbol, data], index) => ({
    name: symbol,
    value: parseFloat(data.balance) * (Math.random() * 1000 + 500), // Mock USD value
    color: COLORS[index % COLORS.length]
  }));

  const timeRanges = ['1D', '1W', '1M', '3M', '1Y'];

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-64 bg-gray-700 rounded-lg mb-4"></div>
        <div className="h-64 bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Portfolio Analytics</h2>
        <div className="flex space-x-2">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Value Chart */}
      <div className="h-64 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={portfolioData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
              stroke="#9CA3AF"
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
              labelStyle={{ color: '#9CA3AF' }}
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

      {/* Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Asset Allocation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetAllocation}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {assetAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  formatter={(value) => `$${parseFloat(value).toFixed(2)}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-white mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">24h Change</p>
              <p className="text-xl font-semibold text-green-500">+5.23%</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">7d Change</p>
              <p className="text-xl font-semibold text-red-500">-2.45%</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Value</p>
              <p className="text-xl font-semibold text-white">$12,345.67</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">All-Time High</p>
              <p className="text-xl font-semibold text-white">$15,789.12</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortfolioAnalytics; 