import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush
} from 'recharts';
import ChartFilter from '../common/ChartFilter';
import api from '../../services/api';
import ExportButton from '../common/ExportButton';

function NetworkActivityChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [granularity, setGranularity] = useState('1h');
  const [focusBar, setFocusBar] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Replace with actual API endpoint
      const response = await api.get('/network-activity', {
        params: { timeRange, granularity }
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch network activity:', error);
      // Mock data for development
      setData(generateMockData(timeRange, granularity));
    } finally {
      setLoading(false);
    }
  }, [timeRange, granularity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMouseMove = (state) => {
    if (state.activeTooltipIndex) {
      setFocusBar(state.activeTooltipIndex);
    } else {
      setFocusBar(null);
    }
  };

  const prepareExportData = () => {
    return data.map(item => ({
      timestamp: item.timestamp,
      transactions: item.transactions
    }));
  };

  if (loading) {
    return <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>;
  }

  return (
    <div id="network-activity-chart">
      <div className="flex justify-between items-center mb-4">
        <ChartFilter
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          granularity={granularity}
          setGranularity={setGranularity}
        />
        <ExportButton 
          data={data}
          filename={`network-activity-${timeRange}`}
          chartId="network-activity-chart"
        />
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            onMouseMove={handleMouseMove}
          >
            <defs>
              <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ 
                value: 'Transactions', 
                angle: -90, 
                position: 'insideLeft',
                fontSize: 12 
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <Area
              type="monotone"
              dataKey="transactions"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorTx)"
            />
            <Brush 
              dataKey="timestamp"
              height={30}
              stroke="#8884d8"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <StatCard
          title="Peak Transactions"
          value={Math.max(...data.map(d => d.transactions))}
        />
        <StatCard
          title="Average Transactions"
          value={Math.round(data.reduce((acc, curr) => acc + curr.transactions, 0) / data.length)}
        />
        <StatCard
          title="Total Transactions"
          value={data.reduce((acc, curr) => acc + curr.transactions, 0)}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-lg font-semibold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}

// Helper function to generate mock data
function generateMockData(timeRange, granularity) {
  const data = [];
  const now = new Date();
  let points;
  let interval;

  switch (timeRange) {
    case '7d':
      points = 168;
      interval = 3600000;
      break;
    case '30d':
      points = 720;
      interval = 3600000;
      break;
    case '90d':
      points = 90;
      interval = 86400000;
      break;
    default: // 24h
      points = 288;
      interval = 300000;
  }

  for (let i = points; i >= 0; i--) {
    data.push({
      timestamp: new Date(now - i * interval).toLocaleString(),
      transactions: Math.floor(Math.random() * 100) + 20
    });
  }

  return data;
}

export default NetworkActivityChart; 