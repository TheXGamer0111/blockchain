import { useSelector, useDispatch } from 'react-redux';
import { connectWallet, disconnectWallet } from '../../store/slices/walletSlice';

function WalletConnect() {
  const dispatch = useDispatch();
  const { address, isConnected, loading } = useSelector((state) => state.wallet);

  const handleConnect = async () => {
    if (isConnected) {
      dispatch(disconnectWallet());
    } else {
      dispatch(connectWallet());
    }
  };

  return (
    <div className="flex items-center">
      {isConnected ? (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            onClick={handleConnect}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className={`bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
}

export default WalletConnect;
