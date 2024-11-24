import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Web3 from 'web3';
import { toast } from 'react-toastify';

function TokenSwap() {
  const dispatch = useDispatch();
  const { address, tokens } = useSelector((state) => state.wallet);
  const [loading, setLoading] = useState(false);
  const [swapDetails, setSwapDetails] = useState({
    fromToken: 'ETH',
    toToken: 'DAI',
    fromAmount: '',
    toAmount: '',
    slippage: '0.5'
  });
  const [priceImpact, setPriceImpact] = useState('0.00');
  const [route, setRoute] = useState([]);

  // Mock price data - in production, you'd fetch real prices
  const mockPrices = {
    'ETH-DAI': 1800,
    'ETH-USDC': 1800,
    'DAI-USDC': 1,
  };

  const calculateToAmount = (fromAmount, fromToken, toToken) => {
    if (!fromAmount) return '';
    const rate = mockPrices[`${fromToken}-${toToken}`] || 1/mockPrices[`${toToken}-${fromToken}`];
    return (parseFloat(fromAmount) * rate).toFixed(6);
  };

  const handleFromAmountChange = (value) => {
    setSwapDetails(prev => ({
      ...prev,
      fromAmount: value,
      toAmount: calculateToAmount(value, prev.fromToken, prev.toToken)
    }));
  };

  const handleSwap = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock swap implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Swap executed successfully!');
      setSwapDetails(prev => ({ ...prev, fromAmount: '', toAmount: '' }));
    } catch (error) {
      toast.error(`Swap failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchTokens = () => {
    setSwapDetails(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount
    }));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Swap Tokens</h2>
      
      <form onSubmit={handleSwap} className="space-y-4">
        {/* From Token */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-400">From</label>
            <span className="text-sm text-gray-400">
              Balance: {tokens[swapDetails.fromToken]?.balance || '0.00'}
            </span>
          </div>
          <div className="flex space-x-4">
            <input
              type="number"
              value={swapDetails.fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              placeholder="0.0"
              className="bg-transparent text-white text-2xl outline-none flex-1"
            />
            <select
              value={swapDetails.fromToken}
              onChange={(e) => setSwapDetails(prev => ({ ...prev, fromToken: e.target.value }))}
              className="bg-gray-600 text-white rounded-lg px-3 py-1"
            >
              <option value="ETH">ETH</option>
              <option value="DAI">DAI</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
        </div>

        {/* Switch Tokens Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwitchTokens}
            className="bg-gray-700 p-2 rounded-full hover:bg-gray-600"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To Token */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-400">To</label>
            <span className="text-sm text-gray-400">
              Balance: {tokens[swapDetails.toToken]?.balance || '0.00'}
            </span>
          </div>
          <div className="flex space-x-4">
            <input
              type="text"
              value={swapDetails.toAmount}
              readOnly
              placeholder="0.0"
              className="bg-transparent text-white text-2xl outline-none flex-1"
            />
            <select
              value={swapDetails.toToken}
              onChange={(e) => setSwapDetails(prev => ({ ...prev, toToken: e.target.value }))}
              className="bg-gray-600 text-white rounded-lg px-3 py-1"
            >
              <option value="DAI">DAI</option>
              <option value="USDC">USDC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>
        </div>

        {/* Swap Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Price Impact</span>
            <span>{priceImpact}%</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Slippage Tolerance</span>
            <select
              value={swapDetails.slippage}
              onChange={(e) => setSwapDetails(prev => ({ ...prev, slippage: e.target.value }))}
              className="bg-transparent text-white"
            >
              <option value="0.1">0.1%</option>
              <option value="0.5">0.5%</option>
              <option value="1.0">1.0%</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <button
          type="submit"
          disabled={loading || !swapDetails.fromAmount}
          className={`w-full py-3 rounded-lg text-white font-medium ${
            loading || !swapDetails.fromAmount
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Swapping...' : 'Swap'}
        </button>
      </form>
    </div>
  );
}

export default TokenSwap; 