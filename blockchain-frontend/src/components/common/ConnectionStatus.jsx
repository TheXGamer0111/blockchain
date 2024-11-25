import React, { useState } from 'react';
import { useWebSocket } from '../../services/websocket';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const ConnectionStatus = () => {
  const { isConnected: wsConnected } = useWebSocket();
  const { isConnected: walletConnected, networkId, address, balance } = useSelector((state) => state.wallet);
  const [showDetails, setShowDetails] = useState(false);

  const getNetworkName = (id) => {
    switch (id) {
      case 1: return 'Mainnet';
      case 3: return 'Ropsten';
      case 4: return 'Rinkeby';
      case 5: return 'Goerli';
      case 42: return 'Kovan';
      case 11155111: return 'Sepolia';
      default: return 'Unknown';
    }
  };

  const getNetworkColor = (id) => {
    switch (id) {
      case 1: return 'bg-blue-500';
      case 3: return 'bg-pink-500';
      case 4: return 'bg-yellow-500';
      case 5: return 'bg-purple-500';
      case 42: return 'bg-green-500';
      case 11155111: return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const handleWalletClick = () => {
    if (walletConnected) {
      toast.info(
        <div>
          <p><strong>Address:</strong> {address}</p>
          <p><strong>Balance:</strong> {Number(balance).toFixed(4)} ETH</p>
          <p><strong>Network:</strong> {getNetworkName(networkId)}</p>
        </div>,
        {
          toastId: 'wallet-details',
          autoClose: 5000,
        }
      );
    }
  };

  const handleNetworkClick = () => {
    if (wsConnected) {
      toast.info(
        'Blockchain network connection is active',
        {
          toastId: 'network-details',
          autoClose: 3000,
        }
      );
    } else {
      toast.warning(
        'Blockchain network connection is inactive. Attempting to reconnect...',
        {
          toastId: 'network-warning',
          autoClose: 3000,
        }
      );
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
      {/* Wallet Connection Status */}
      <div 
        onClick={handleWalletClick}
        className="flex items-center bg-gray-800 px-4 py-2 rounded-full shadow-lg 
          hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
      >
        <div 
          className={`w-3 h-3 rounded-full mr-2 ${
            walletConnected ? 'bg-green-500' : 'bg-red-500'
          } ${
            walletConnected ? 'animate-pulse' : ''
          }`}
        />
        <span className="text-sm text-white mr-2">
          {walletConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
        </span>
        {walletConnected && networkId && (
          <>
            <div className="w-1 h-1 bg-gray-600 rounded-full mx-2" />
            <span className={`text-sm px-2 py-0.5 rounded-full ${getNetworkColor(networkId)} text-white`}>
              {getNetworkName(networkId)}
            </span>
          </>
        )}
      </div>

      {/* WebSocket Connection Status */}
      <div 
        onClick={handleNetworkClick}
        className="flex items-center bg-gray-800 px-4 py-2 rounded-full shadow-lg 
          hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
      >
        <div 
          className={`w-3 h-3 rounded-full mr-2 ${
            wsConnected ? 'bg-green-500' : 'bg-red-500'
          } ${
            wsConnected ? 'animate-pulse' : ''
          }`}
        />
        <span className="text-sm text-white">
          {wsConnected ? 'Network Connected' : 'Network Disconnected'}
        </span>
      </div>

      {/* Optional: Add a tooltip hint */}
      <div className="text-xs text-gray-500 text-center mt-1">
        Click for more details
      </div>
    </div>
  );
};

export default ConnectionStatus; 