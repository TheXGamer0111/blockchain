function ChartFilter({ timeRange, setTimeRange, granularity, setGranularity }) {
  return (
    <div className="flex space-x-4 mb-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Time Range:</span>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="block w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Granularity:</span>
        <select
          value={granularity}
          onChange={(e) => setGranularity(e.target.value)}
          className="block w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="5m">5 Minutes</option>
          <option value="1h">1 Hour</option>
          <option value="1d">1 Day</option>
          <option value="1w">1 Week</option>
        </select>
      </div>
    </div>
  );
}

export default ChartFilter; 