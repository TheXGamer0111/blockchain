import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { connectWallet, loadTokenBalances } from '../store/slices/walletSlice';
import WalletOverview from '../components/wallet/WalletOverview';
import TokenList from '../components/wallet/TokenList';
import TokenSwap from '../components/wallet/TokenSwap';
import GasPriceTracker from '../components/wallet/GasPriceTracker';
import NFTGallery from '../components/wallet/NFTGallery';
import PriceAlerts from '../components/wallet/PriceAlerts';
import PortfolioAnalytics from '../components/wallet/PortfolioAnalytics';
import TransactionSettings from '../components/wallet/TransactionSettings';
import NetworkSelector from '../components/wallet/NetworkSelector';
import WalletActivity from '../components/wallet/WalletActivity';

function Wallet() {
  const dispatch = useDispatch();
  const { isConnected, address, error } = useSelector((state) => state.wallet);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isConnected) {
      dispatch(connectWallet());
    } else if (address) {
      dispatch(loadTokenBalances(address));
    }
  }, [dispatch, isConnected, address]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-medium text-white mb-4">Connect Your Wallet</h2>
          <button
            onClick={() => dispatch(connectWallet())}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Connect MetaMask
          </button>
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'swap', name: 'Swap' },
    { id: 'nfts', name: 'NFTs' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'settings', name: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <NetworkSelector />
      </div>

      {activeTab === 'overview' && (
        <>
          <WalletOverview />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TokenList />
            <GasPriceTracker />
          </div>
          <WalletActivity />
          <PriceAlerts />
        </>
      )}

      {activeTab === 'swap' && <TokenSwap />}
      {activeTab === 'nfts' && <NFTGallery />}
      {activeTab === 'analytics' && <PortfolioAnalytics />}
      {activeTab === 'settings' && <TransactionSettings />}
    </div>
  );
}

export default Wallet;
