import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function TokenDistributionChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');

  useEffect(() => {
    fetchData();
  }, [selectedTimeframe]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Replace with actual API endpoint
      const response = await api.get(`/token-distribution/${selectedTimeframe}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch token distribution:', error);
      // Mock data
      setData([
        { name: 'Staking', value: 45, details: 'Tokens locked in staking' },
        { name: 'Circulation', value: 30, details: 'Tokens in circulation' },
        { name: 'Treasury', value: 15, details: 'Treasury reserves' },
        { name: 'Team', value: 10, details: 'Team allocation' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props) => {
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props;

    return (
      <g>
        <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#999">
          {`${value.toLocaleString()} tokens`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius - 5}
          outerRadius={outerRadius + 20}
          fill={fill}
          opacity={0.3}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded shadow-lg border">
          <h3 className="font-bold text-gray-900">{data.name}</h3>
          <p className="text-gray-600">{data.details}</p>
          <p className="text-blue-600 font-medium">
            {data.value.toLocaleString()} tokens ({(data.value / totalTokens * 100).toFixed(2)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>;
  }

  const totalTokens = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Token Distribution</h2>
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          className="block px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="current">Current</option>
          <option value="1month">1 Month Ago</option>
          <option value="3months">3 Months Ago</option>
          <option value="launch">Since Launch</option>
        </select>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Sector
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              startAngle={90}
              endAngle={450}
              fill="#8884d8"
              cornerRadius={10}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieEnter}
              activeShape={renderActiveShape}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TokenDistributionChart; 