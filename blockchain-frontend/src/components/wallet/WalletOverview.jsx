import { useSelector } from 'react-redux';
import { formatEther } from 'ethers';

function WalletOverview() {
  const { address, balance, networkId, tokens } = useSelector((state) => state.wallet);

  const getTotalValue = () => {
    // Mock price data - in a real app, you'd fetch current prices
    const prices = {
      'ETH': 2000,
      'DAI': 1,
      'USDC': 1,
      'USDT': 1
    };

    const ethValue = parseFloat(balance) * prices.ETH;
    const tokenValue = Object.values(tokens).reduce((acc, token) => {
      return acc + (parseFloat(token.balance) * (prices[token.symbol] || 0));
    }, 0);

    return (ethValue + tokenValue).toFixed(2);
  };

  const getNetworkName = (id) => {
    const networks = {
      1: 'Ethereum Mainnet',
      3: 'Ropsten',
      4: 'Rinkeby',
      5: 'Goerli',
      42: 'Kovan',
      137: 'Polygon',
      80001: 'Mumbai'
    };
    return networks[id] || 'Unknown Network';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <h3 className="text-gray-400 text-sm">Total Portfolio Value</h3>
          <p className="text-2xl font-bold text-white">${getTotalValue()}</p>
        </div>
        
        <div>
          <h3 className="text-gray-400 text-sm">ETH Balance</h3>
          <p className="text-2xl font-bold text-white">{parseFloat(balance).toFixed(4)} ETH</p>
        </div>

        <div>
          <h3 className="text-gray-400 text-sm">Network</h3>
          <p className="text-lg font-medium text-white">{getNetworkName(networkId)}</p>
        </div>

        <div>
          <h3 className="text-gray-400 text-sm">Address</h3>
          <div className="flex items-center space-x-2">
            <p className="text-white font-medium truncate">
              {address}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(address)}
              className="text-indigo-400 hover:text-indigo-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WalletOverview; 