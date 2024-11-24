import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { connectWallet, disconnectWallet } from '../../store/slices/walletSlice';
import { toast } from 'react-toastify';
import Web3 from 'web3';
import { wsService } from '../../services/websocket';

const WalletConnect = () => {
  const dispatch = useDispatch();
  const { isConnected, address, balance, loading } = useSelector((state) => state.wallet);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConnect = async () => {
    if (isProcessing) {
      toast.info('Connection in progress. Please check MetaMask.');
      return;
    }

    try {
      setIsProcessing(true);

      if (!window.ethereum) {
        toast.error('Please install MetaMask!');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length > 0) {
        const web3 = new Web3(window.ethereum);
        const address = accounts[0];
        const balance = await web3.eth.getBalance(address);
        const networkId = await web3.eth.net.getId();

        await dispatch(connectWallet({
          address,
          balance: web3.utils.fromWei(balance, 'ether'),
          networkId: Number(networkId)
        })).unwrap();

        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      console.error('Connection error:', error);
      if (error.code === -32002) {
        toast.info('Please check MetaMask for pending connection request');
      } else {
        toast.error(error.message || 'Failed to connect wallet');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // First disconnect WebSocket
      if (wsService) {
        wsService.disconnect();
      }

      await dispatch(disconnectWallet());

      // Clear any cached provider state
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }

      // Clear local storage
      localStorage.clear();

      toast.success('Wallet disconnected successfully', {
        toastId: 'wallet-disconnect'
      });

      // Force reload without cache
      window.location.reload();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error(error.message || 'Failed to disconnect wallet', {
        toastId: 'wallet-disconnect-error'
      });
    }
  };

  // Event listeners
  useEffect(() => {
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0 && isConnected) {
        await dispatch(disconnectWallet());
      }
    };

    const handleChainChanged = () => {
      if (isConnected) {
        window.location.reload();
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [dispatch, isConnected]);

  return (
    <div className="flex items-center space-x-4">
      {isConnected ? (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">
            {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
          </span>
          {balance && (
            <span className="text-sm text-gray-300">
              {`${Number(balance).toFixed(4)} ETH`}
            </span>
          )}
          <button
            onClick={handleDisconnect}
            disabled={loading || isProcessing}
            className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${
              (loading || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading || isProcessing}
          className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
            (loading || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
