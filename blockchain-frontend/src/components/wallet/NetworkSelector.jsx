import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { switchNetwork } from '../../store/slices/walletSlice';

function NetworkSelector() {
  const dispatch = useDispatch();
  const { networkId } = useSelector((state) => state.wallet);
  const [isOpen, setIsOpen] = useState(false);

  const networks = [
    { id: 1, name: 'Ethereum Mainnet', chainId: '0x1' },
    { id: 137, name: 'Polygon', chainId: '0x89' },
    { id: 56, name: 'BSC', chainId: '0x38' },
    { id: 42161, name: 'Arbitrum', chainId: '0xa4b1' },
    { id: 10, name: 'Optimism', chainId: '0xa' },
  ];

  const handleNetworkSwitch = async (chainId) => {
    try {
      await dispatch(switchNetwork(chainId)).unwrap();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
      >
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-white">
          {networks.find(n => n.id === networkId)?.name || 'Unknown Network'}
        </span>
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-56 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => handleNetworkSwitch(network.chainId)}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600"
                role="menuitem"
              >
                {network.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkSelector; 