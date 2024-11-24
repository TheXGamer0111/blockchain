import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import WalletConnect from '../wallet/WalletConnect';

function Navbar({ setSidebarOpen }) {
  const { address } = useSelector((state) => state.wallet);
  const location = useLocation();

  // Function to get page title from path
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'Dashboard';
      case '/staking':
        return 'Staking';
      case '/governance':
        return 'Governance';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="ml-4 text-xl font-semibold text-white">
              {getPageTitle(location.pathname)}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Network Status */}
            <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-gray-700">
              <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
              <span className="text-sm text-gray-300">Mainnet</span>
            </div>

            {/* Wallet */}
            <WalletConnect />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
