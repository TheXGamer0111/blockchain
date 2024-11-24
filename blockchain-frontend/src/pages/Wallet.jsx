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
import { toast } from 'react-hot-toast';

function Wallet() {
  const dispatch = useDispatch();
  const { isConnected, address, error, loading } = useSelector((state) => state.wallet);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isConnected && address) {
      dispatch(loadTokenBalances(address));
    }
  }, [dispatch, isConnected, address]);

  const handleConnect = async () => {
    try {
      if (!window.ethereum) {
        toast.error('Please install MetaMask!');
        return;
      }
      await dispatch(connectWallet()).unwrap();
    } catch (error) {
      console.error('Failed to connect:', error);
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-medium text-white mb-4">Connect Your Wallet</h2>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect MetaMask'}
          </button>
          {error && (
            <p className="mt-2 text-red-500 text-sm">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Waiting for wallet connection...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
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
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
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
