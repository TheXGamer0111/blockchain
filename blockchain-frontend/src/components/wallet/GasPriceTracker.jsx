import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Web3 from 'web3';

function GasPriceTracker() {
  const [gasPrices, setGasPrices] = useState({
    slow: 0,
    standard: 0,
    fast: 0,
    instant: 0
  });
  const [loading, setLoading] = useState(true);
  const { networkId } = useSelector((state) => state.wallet);

  useEffect(() => {
    const fetchGasPrices = async () => {
      try {
        const web3 = new Web3(window.ethereum);
        const gasPrice = await web3.eth.getGasPrice();
        const baseGwei = Web3.utils.fromWei(gasPrice, 'gwei');
        
        setGasPrices({
          slow: (parseFloat(baseGwei) * 0.8).toFixed(0),
          standard: parseFloat(baseGwei).toFixed(0),
          fast: (parseFloat(baseGwei) * 1.2).toFixed(0),
          instant: (parseFloat(baseGwei) * 1.5).toFixed(0)
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching gas prices:', error);
      }
    };

    const interval = setInterval(fetchGasPrices, 15000); // Update every 15 seconds
    fetchGasPrices();

    return () => clearInterval(interval);
  }, [networkId]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-medium text-white mb-4">Gas Prices (Gwei)</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-400">Slow</div>
          <div className="text-xl font-semibold text-white">{gasPrices.slow}</div>
          <div className="text-xs text-gray-400">~5 min</div>
        </div>
        <div className="p-3 bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-400">Standard</div>
          <div className="text-xl font-semibold text-white">{gasPrices.standard}</div>
          <div className="text-xs text-gray-400">~2 min</div>
        </div>
        <div className="p-3 bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-400">Fast</div>
          <div className="text-xl font-semibold text-white">{gasPrices.fast}</div>
          <div className="text-xs text-gray-400">~30 sec</div>
        </div>
        <div className="p-3 bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-400">Instant</div>
          <div className="text-xl font-semibold text-white">{gasPrices.instant}</div>
          <div className="text-xs text-gray-400">~10 sec</div>
        </div>
      </div>
    </div>
  );
}

export default GasPriceTracker; 