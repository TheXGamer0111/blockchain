// New component: blockchain-frontend/src/components/analytics/BlockchainMetrics.jsx
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { fetchAnalytics } from '../../store/analyticsSlice'
import { useDataPolling } from '../../hooks/useDataPolling'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function BlockchainMetrics() {
  const dispatch = useDispatch()
  const { blockTimes, transactionVolume, networkHashrate, isLoading } = useSelector(
    state => state.analytics
  )

  // Use the optimized polling hook with a longer interval
  useDataPolling(fetchAnalytics, 60000) // Poll every minute instead of every 30 seconds

  // Only show last 10 blocks in charts to reduce data load
  const recentBlockTimes = blockTimes.slice(-10)
  const recentTransactions = transactionVolume.slice(-10)
  const recentHashrates = networkHashrate.slice(-10)

  const blockTimeData = {
    labels: recentBlockTimes.map((_, i) => `Block ${i}`),
    datasets: [{
      label: 'Block Time (seconds)',
      data: recentBlockTimes,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  }

  const transactionData = {
    labels: recentTransactions.map((_, i) => `Block ${i}`),
    datasets: [{
      label: 'Transaction Count',
      data: recentTransactions,
      backgroundColor: 'rgb(153, 102, 255)',
    }]
  }

  const hashrateData = {
    labels: recentHashrates.map((_, i) => `Block ${i}`),
    datasets: [{
      label: 'Network Hashrate (H/s)',
      data: recentHashrates,
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.1
    }]
  }

  if (isLoading) {
    return <div>Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Block Time Analysis</h2>
        <Line data={blockTimeData} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Transaction Volume</h2>
        <Bar data={transactionData} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Network Hashrate</h2>
        <Line data={hashrateData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Average Block Time</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {(recentBlockTimes.reduce((a, b) => a + b, 0) / recentBlockTimes.length).toFixed(2)}s
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {recentTransactions.reduce((a, b) => a + b, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Current Hashrate</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {recentHashrates[recentHashrates.length - 1]} H/s
          </p>
        </div>
      </div>
    </div>
  )
}