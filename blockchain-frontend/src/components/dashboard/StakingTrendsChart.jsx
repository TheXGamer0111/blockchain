import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';
import ChartFilter from '../common/ChartFilter';
import api from '../../services/api';

function StakingTrendsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState(['totalStaked', 'stakingAPY']);
  const [refAreaLeft, setRefAreaLeft] = useState('');
  const [refAreaRight, setRefAreaRight] = useState('');
  const [zoomData, setZoomData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/staking-trends', {
        params: { timeRange }
      });
      setData(response.data);
      setZoomData(null);
    } catch (error) {
      console.error('Failed to fetch staking trends:', error);
      setData(generateMockStakingData(timeRange));
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleZoomStart = (event) => {
    if (event.activeLabel) {
      setRefAreaLeft(event.activeLabel);
    }
  };

  const handleZoom = (event) => {
    if (event.activeLabel) {
      setRefAreaRight(event.activeLabel);
    }
  };

  const handleZoomEnd = () => {
    if (refAreaLeft && refAreaRight) {
      let left = data.findIndex(item => item.date === refAreaLeft);
      let right = data.findIndex(item => item.date === refAreaRight);

      if (left > right) [left, right] = [right, left];

      const zoomedData = data.slice(left, right + 1);
      setZoomData(zoomedData);
    }
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  const resetZoom = () => {
    setZoomData(null);
  };

  const toggleMetric = (metric) => {
    setMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  if (loading) {
    return <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>;
  }

  const chartData = zoomData || data;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <ChartFilter
          timeRange={timeRange}
          setTimeRange={setTimeRange}
        />
        <div className="flex space-x-4">
          <button
            onClick={() => toggleMetric('totalStaked')}
            className={`px-3 py-1 rounded ${
              metrics.includes('totalStaked') 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200'
            }`}
          >
            Total Staked
          </button>
          <button
            onClick={() => toggleMetric('stakingAPY')}
            className={`px-3 py-1 rounded ${
              metrics.includes('stakingAPY') 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200'
            }`}
          >
            Staking APY
          </button>
          {zoomData && (
            <button
              onClick={resetZoom}
              className="px-3 py-1 rounded bg-gray-500 text-white"
            >
              Reset Zoom
            </button>
          )}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            onMouseDown={handleZoomStart}
            onMouseMove={handleZoom}
            onMouseUp={handleZoomEnd}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{ 
                value: 'Total Staked', 
                angle: -90, 
                position: 'insideLeft' 
              }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ 
                value: 'APY (%)', 
                angle: 90, 
                position: 'insideRight' 
              }}
            />
            <Tooltip />
            <Legend />
            
            {metrics.includes('totalStaked') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalStaked"
                stroke="#8884d8"
                dot={false}
              />
            )}
            
            {metrics.includes('stakingAPY') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="stakingAPY"
                stroke="#82ca9d"
                dot={false}
              />
            )}

            {refAreaLeft && refAreaRight && (
              <ReferenceArea
                yAxisId="left"
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default StakingTrendsChart; 