import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../../services/api';

function GovernanceActivityChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGovernanceData = async () => {
      try {
        // Replace with actual API endpoint
        const response = await api.get('/governance-activity');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch governance activity:', error);
        // Mock data for development
        setData(generateMockGovernanceData());
      } finally {
        setLoading(false);
      }
    };

    fetchGovernanceData();
  }, []);

  if (loading) {
    return <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="proposals"
            fill="#8884d8"
            name="Proposals"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="participation"
            stroke="#82ca9d"
            name="Participation Rate"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Helper function to generate mock data
function generateMockGovernanceData() {
  const data = [];
  const now = new Date();
  
  for (let i = 12; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toLocaleDateString(),
      proposals: Math.floor(Math.random() * 5),
      participation: Math.floor(Math.random() * 30 + 70)
    });
  }
  
  return data;
}

export default GovernanceActivityChart; 